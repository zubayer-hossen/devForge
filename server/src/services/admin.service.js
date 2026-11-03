import {
  User,
  Application,
  Task,
  TaskAssignment,
  Submission,
  SubmissionReview,
  Notification,
  GroupMembership,
  Achievement,
  PointTransaction,
  Comment,
  DiscussionPost,
  ActivityLog,
  EmailLog,
  SystemSetting,
} from "../models/index.js";
import { ACCOUNT_STATUS } from "../constants/index.js";
import { AppError } from "../utils/AppError.js";
import {
  escapeRegex,
  paginate,
  parsePagination,
  parseSort,
} from "../utils/pagination.js";
import { canManageUser, canChangeRole } from "./permissions.js";
import { enqueueEmail } from "./email/email.service.js";
import { createNotification } from "./notification.service.js";
import { logActivity } from "./activity.service.js";
import { invalidateSettingsCache } from "./settings.service.js";
import { uploadBuffer, deleteAsset } from "./upload.service.js";
import { assignAllPublishedTasksToUser } from "./task.service.js";

const DAY = 86_400_000;
const dhakaDay = (d) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(d); // YYYY-MM-DD

const MEMBER_LIST_FIELDS =
  "fullName username email phone role status points streak avatar lastActiveAt createdAt emailVerified";

async function userIdsMatching(search) {
  const rx = new RegExp(escapeRegex(search), "i");
  const users = await User.find({
    $or: [{ fullName: rx }, { username: rx }, { email: rx }],
  })
    .select("_id")
    .limit(500)
    .lean();
  return users.map((u) => u._id);
}

/* ---------- Overview ---------- */
export async function getOverview() {
  const now = new Date();
  const weekAgo = new Date(now - 7 * DAY);
  const monthAgo = new Date(now - 30 * DAY);

  const [
    statusAgg,
    active,
    taskAgg,
    completedTasks,
    pendingSubs,
    totalProjects,
    overdue,
    signupAgg,
    recent,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    User.countDocuments({
      status: ACCOUNT_STATUS.APPROVED,
      lastActiveAt: { $gte: weekAgo },
    }),
    Task.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    TaskAssignment.countDocuments({ status: "COMPLETED" }),
    Submission.countDocuments({
      status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
    }),
    Submission.countDocuments({}),
    Task.countDocuments({ status: "PUBLISHED", deadline: { $lt: now } }),
    User.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Dhaka",
            },
          },
          n: { $sum: 1 },
        },
      },
    ]),
    ActivityLog.find({ action: { $ne: "AUTH_LOGIN_FAILED" } })
      .sort("-createdAt")
      .limit(8)
      .populate("actor", "fullName username")
      .lean(),
  ]);

  const statusCounts = Object.fromEntries(
    Object.values(ACCOUNT_STATUS).map((s) => [s, 0]),
  );
  statusAgg.forEach((r) => {
    statusCounts[r._id] = r.n;
  });
  const taskCounts = { DRAFT: 0, PUBLISHED: 0, CLOSED: 0 };
  taskAgg.forEach((r) => {
    taskCounts[r._id] = r.n;
  });

  const bySignup = Object.fromEntries(signupAgg.map((r) => [r._id, r.n]));
  const signups = Array.from({ length: 30 }, (_, i) => {
    const day = dhakaDay(new Date(now - (29 - i) * DAY));
    return { date: day, count: bySignup[day] || 0 };
  });

  const approved = statusCounts.APPROVED;
  return {
    members: {
      total: approved + statusCounts.SUSPENDED,
      approved,
      suspended: statusCounts.SUSPENDED,
      pending: statusCounts.PENDING_APPROVAL,
      rejected: statusCounts.REJECTED,
      waitlisted: statusCounts.WAITLISTED,
      unverified: statusCounts.EMAIL_UNVERIFIED,
      active,
      inactive: Math.max(approved - active, 0),
    },
    statusCounts,
    tasks: {
      total: taskCounts.DRAFT + taskCounts.PUBLISHED + taskCounts.CLOSED,
      ...taskCounts,
      completedAssignments: completedTasks,
      overdue,
    },
    submissions: { pending: pendingSubs, totalProjects },
    signups,
    recentActivity: recent,
  };
}

export async function getCounts() {
  const [pendingApplications, pendingSubmissions] = await Promise.all([
    Application.countDocuments({ status: ACCOUNT_STATUS.PENDING_APPROVAL }),
    Submission.countDocuments({
      status: { $in: ["SUBMITTED", "UNDER_REVIEW"] },
    }),
  ]);
  return { pendingApplications, pendingSubmissions };
}

/* ---------- Applications ---------- */
export async function listApplications(q) {
  const filter = {};
  filter.status = q.status || {
    $in: ["PENDING_APPROVAL", "WAITLISTED", "REJECTED", "APPROVED"],
  };
  if (q.search) filter.user = { $in: await userIdsMatching(q.search) };
  return paginate(Application, filter, parsePagination(q), {
    sort:
      q.status === "PENDING_APPROVAL" || !q.status ? "createdAt" : "-updatedAt",
    populate: [
      {
        path: "user",
        select: "fullName username email phone avatar createdAt",
      },
      { path: "reviewedBy", select: "fullName" },
    ],
  });
}

export async function decideApplication(id, { decision, note }, actor, req) {
  const app = await Application.findById(id);
  if (!app) throw AppError.notFound("আবেদন পাওয়া যায়নি");
  const user = await User.findById(app.user);
  if (!user) throw AppError.notFound("আবেদনকারী পাওয়া যায়নি");
  if (!user.emailVerified)
    throw AppError.badRequest("আবেদনকারীর ইমেইল এখনো যাচাই হয়নি");
  if (
    !["PENDING_APPROVAL", "WAITLISTED", "REJECTED"].includes(app.status) ||
    user.status === ACCOUNT_STATUS.SUSPENDED
  ) {
    throw AppError.conflict("এই আবেদনে এখন সিদ্ধান্ত নেওয়া যাবে না");
  }
  if (app.status === decision)
    throw AppError.badRequest("আবেদনটি ইতিমধ্যে এই অবস্থায় আছে");

  const now = new Date();
  const userSet = { status: decision };
  if (decision === "APPROVED") {
    userSet.approvedAt = now;
    userSet.approvedBy = actor._id;
  }
  await User.updateOne({ _id: user._id }, { $set: userSet });
  // পুরনো মন্তব্য নতুন সিদ্ধান্তে ভুলে থেকে না যায়, তাই মন্তব্য না দিলে ফাঁকা করা হয় (undefined নয়)
  await Application.updateOne(
    { _id: app._id },
    {
      $set: {
        status: decision,
        reviewedBy: actor._id,
        reviewedAt: now,
        reviewNote: note || "",
      },
    },
  );

  // নতুন অনুমোদিত সদস্য আগে থেকে প্রকাশিত "সবার জন্য" টাস্কগুলো পায়
  if (decision === "APPROVED") {
    await assignAllPublishedTasksToUser({
      _id: user._id,
      role: user.role,
      status: ACCOUNT_STATUS.APPROVED,
    });
  }

  const stamp = now.getTime();
  const base = { to: user.email, data: { name: user.fullName, note } };
  if (decision === "APPROVED") {
    await enqueueEmail({
      ...base,
      type: "APPROVAL",
      dedupeKey: `approval:${user._id}:${stamp}`,
    });
    await enqueueEmail({
      ...base,
      type: "WELCOME",
      dedupeKey: `welcome:${user._id}:${stamp}`,
    });
  } else if (decision === "REJECTED") {
    await enqueueEmail({
      ...base,
      type: "REJECTION",
      dedupeKey: `rejection:${user._id}:${stamp}`,
    });
  } else {
    await enqueueEmail({
      ...base,
      type: "WAITLIST",
      dedupeKey: `waitlist:${user._id}:${stamp}`,
    });
  }

  const text = {
    APPROVED: "আপনার আবেদন অনুমোদিত হয়েছে",
    REJECTED: "আপনার আবেদন গ্রহণ করা হয়নি",
    WAITLISTED: "আপনি ওয়েটলিস্টে আছেন",
  }[decision];
  await createNotification({
    user: user._id,
    type: "ACCOUNT_STATUS",
    title: text,
    message: note || "",
    link: "/",
  });
  await logActivity({
    actor: actor._id,
    action: `APPLICATION_${decision}`,
    targetType: "User",
    targetId: user._id,
    metadata: { note, username: user.username },
    req,
    isAudit: true,
  });
  return { id: String(app._id), status: decision };
}

/* ---------- Members ---------- */
export async function listMembers(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  else filter.status = { $ne: ACCOUNT_STATUS.EMAIL_UNVERIFIED };
  if (q.role) filter.role = q.role;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    filter.$or = [{ fullName: rx }, { username: rx }, { email: rx }];
  }
  const sort = parseSort(q.sort, [
    "createdAt",
    "fullName",
    "points",
    "lastActiveAt",
  ]);
  return paginate(User, filter, parsePagination(q), {
    sort,
    select: MEMBER_LIST_FIELDS,
  });
}

export async function getMemberDetail(id) {
  const user = await User.findById(id);
  if (!user) throw AppError.notFound("সদস্য পাওয়া যায়নি");
  const [application, assignAgg, submissions, activity] = await Promise.all([
    Application.findOne({ user: id }).lean(),
    TaskAssignment.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]),
    Submission.find({ user: id })
      .sort("-createdAt")
      .limit(20)
      .select("title status createdAt pointsAwarded")
      .lean(),
    ActivityLog.find({ actor: id }).sort("-createdAt").limit(15).lean(),
  ]);
  const tasks = {
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    SUBMITTED: 0,
    COMPLETED: 0,
    OVERDUE: 0,
  };
  assignAgg.forEach((r) => {
    tasks[r._id] = r.n;
  });
  return { user: user.toSafeJSON(), application, tasks, submissions, activity };
}

async function loadManageable(id, actor) {
  const target = await User.findById(id);
  if (!target) throw AppError.notFound("সদস্য পাওয়া যায়নি");
  if (!canManageUser(actor, target))
    throw AppError.forbidden("এই অ্যাকাউন্টে এই কাজ করার অনুমতি আপনার নেই");
  return target;
}

export async function updateMember(id, data, actor, req) {
  const target = await loadManageable(id, actor);
  const clean = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      v === "" && (k === "githubUrl" || k === "portfolioUrl") ? undefined : v,
    ]),
  );
  const $set = {};
  const $unset = {};
  Object.entries(clean).forEach(([k, v]) => {
    if (v === undefined) $unset[k] = 1;
    else $set[k] = v;
  });
  await User.updateOne(
    { _id: target._id },
    {
      ...(Object.keys($set).length ? { $set } : {}),
      ...(Object.keys($unset).length ? { $unset } : {}),
    },
  );
  await logActivity({
    actor: actor._id,
    action: "MEMBER_UPDATED",
    targetType: "User",
    targetId: target._id,
    metadata: { fields: Object.keys(data) },
    req,
    isAudit: true,
  });
  return getMemberDetail(id);
}

export async function suspendMember(id, { reason }, actor, req) {
  const target = await loadManageable(id, actor);
  if (target.status !== ACCOUNT_STATUS.APPROVED)
    throw AppError.badRequest("শুধু অনুমোদিত সদস্যকে স্থগিত করা যায়");
  await User.updateOne(
    { _id: target._id },
    {
      $set: {
        status: ACCOUNT_STATUS.SUSPENDED,
        suspendedReason: reason,
        refreshTokenHashes: [],
      },
    },
  );
  await createNotification({
    user: target._id,
    type: "ACCOUNT_STATUS",
    title: "আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে",
    message: reason,
  });
  await logActivity({
    actor: actor._id,
    action: "MEMBER_SUSPENDED",
    targetType: "User",
    targetId: target._id,
    metadata: { reason, username: target.username },
    req,
    isAudit: true,
  });
  return getMemberDetail(id);
}

export async function reactivateMember(id, actor, req) {
  const target = await loadManageable(id, actor);
  if (target.status !== ACCOUNT_STATUS.SUSPENDED)
    throw AppError.badRequest("অ্যাকাউন্টটি স্থগিত নয়");
  await User.updateOne(
    { _id: target._id },
    {
      $set: { status: ACCOUNT_STATUS.APPROVED },
      $unset: { suspendedReason: 1 },
    },
  );
  await createNotification({
    user: target._id,
    type: "ACCOUNT_STATUS",
    title: "আপনার অ্যাকাউন্ট আবার সক্রিয় করা হয়েছে",
  });
  await logActivity({
    actor: actor._id,
    action: "MEMBER_REACTIVATED",
    targetType: "User",
    targetId: target._id,
    metadata: { username: target.username },
    req,
    isAudit: true,
  });
  return getMemberDetail(id);
}

export async function changeMemberRole(id, { role }, actor, req) {
  const target = await User.findById(id);
  if (!target) throw AppError.notFound("সদস্য পাওয়া যায়নি");
  if (!canChangeRole(actor, target, role))
    throw AppError.forbidden("এই রোল পরিবর্তনের অনুমতি নেই");
  if (role !== "MEMBER" && target.status !== ACCOUNT_STATUS.APPROVED)
    throw AppError.badRequest("শুধু অনুমোদিত সদস্যকে উচ্চতর রোল দেওয়া যায়");
  if (target.role === role)
    throw AppError.badRequest("সদস্যের রোল ইতিমধ্যে এটিই");
  const previous = target.role;
  await User.updateOne({ _id: target._id }, { $set: { role } });
  await logActivity({
    actor: actor._id,
    action: "MEMBER_ROLE_CHANGED",
    targetType: "User",
    targetId: target._id,
    metadata: { from: previous, to: role, username: target.username },
    req,
    isAudit: true,
  });
  return getMemberDetail(id);
}

export async function deleteMember(id, actor, req) {
  const target = await loadManageable(id, actor);
  const subs = await Submission.find({ user: target._id })
    .select("_id screenshots files")
    .lean();
  // Cloudinary-তে এতিম ফাইল না রাখতে: প্রোফাইল ছবি ও সাবমিশনের ফাইল মুছে ফেলা (ব্যর্থ হলে মূল কাজ আটকায় না)
  await deleteAsset(target.avatar?.publicId);
  for (const sb of subs) {
    for (const f of [...(sb.screenshots || []), ...(sb.files || [])])
      await deleteAsset(f.publicId, f.mimeType?.startsWith("image/"));
  }
  await Promise.all([
    Application.deleteMany({ user: target._id }),
    TaskAssignment.deleteMany({ user: target._id }),
    SubmissionReview.deleteMany({
      submission: { $in: subs.map((s) => s._id) },
    }),
    Submission.deleteMany({ user: target._id }),
    Notification.deleteMany({ user: target._id }),
    GroupMembership.deleteMany({ user: target._id }),
    Achievement.deleteMany({ user: target._id }),
    PointTransaction.deleteMany({ user: target._id }),
    Comment.deleteMany({ author: target._id }),
    DiscussionPost.deleteMany({ author: target._id }),
    Task.updateMany(
      { assignedUsers: target._id },
      { $pull: { assignedUsers: target._id } },
    ),
  ]);
  await User.deleteOne({ _id: target._id });
  await logActivity({
    actor: actor._id,
    action: "MEMBER_DELETED",
    targetType: "User",
    metadata: { username: target.username, email: target.email },
    req,
    isAudit: true,
  });
}

/* ---------- Activity / Email / Settings ---------- */
export async function listActivity(q) {
  const filter = {};
  if (q.audit) filter.isAudit = q.audit === "true";
  if (q.search) filter.action = new RegExp(escapeRegex(q.search), "i");
  return paginate(
    ActivityLog,
    filter,
    parsePagination(q, { defaultLimit: 30 }),
    { populate: { path: "actor", select: "fullName username" } },
  );
}

export async function listEmailLogs(q) {
  const filter = q.status ? { status: q.status } : {};
  return paginate(EmailLog, filter, parsePagination(q), { sort: "-createdAt" });
}

const flatten = (obj, prefix = "") =>
  Object.entries(obj).reduce((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v))
      Object.assign(acc, flatten(v, key));
    else acc[key] = v;
    return acc;
  }, {});

export async function getAdminSettings() {
  return (await SystemSetting.getMain()).toObject();
}

export async function updateSettings(data, actor, req) {
  await SystemSetting.getMain();
  const updated = await SystemSetting.findOneAndUpdate(
    { key: "main" },
    { $set: flatten(data) },
    { new: true, runValidators: true },
  );
  invalidateSettingsCache();
  await logActivity({
    actor: actor._id,
    action: "SETTINGS_UPDATED",
    targetType: "SystemSetting",
    metadata: { fields: Object.keys(flatten(data)) },
    req,
    isAudit: true,
  });
  return updated.toObject();
}

export async function setLogo(file, actor, req) {
  const uploaded = await uploadBuffer(file.buffer, {
    folder: "devforge/branding",
    publicId: "logo",
    image: true,
    transformation: [
      { width: 512, height: 512, crop: "limit" },
      { quality: "auto" },
    ],
  });
  await SystemSetting.getMain();
  await SystemSetting.updateOne(
    { key: "main" },
    { $set: { logo: { url: uploaded.url, publicId: uploaded.publicId } } },
  );
  invalidateSettingsCache();
  await logActivity({
    actor: actor._id,
    action: "SETTINGS_UPDATED",
    targetType: "SystemSetting",
    metadata: { fields: ["logo"] },
    req,
    isAudit: true,
  });
  return (await SystemSetting.getMain()).toObject();
}

export async function removeLogo(actor, req) {
  const current = await SystemSetting.getMain();
  await deleteAsset(current.logo?.publicId);
  await SystemSetting.updateOne({ key: "main" }, { $unset: { logo: 1 } });
  invalidateSettingsCache();
  await logActivity({
    actor: actor._id,
    action: "SETTINGS_UPDATED",
    targetType: "SystemSetting",
    metadata: { fields: ["logo (removed)"] },
    req,
    isAudit: true,
  });
  return (await SystemSetting.getMain()).toObject();
}
