import path from 'node:path';
import { Task, TaskAssignment, User, Group, GroupMembership, Submission } from '../models/index.js';
import { ACCOUNT_STATUS, ROLES } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, paginate, parsePagination, parseSort } from '../utils/pagination.js';
import { randomToken } from '../utils/crypto.js';
import { enqueueEmail } from './email/email.service.js';
import { createNotification } from './notification.service.js';
import { getSettings } from './settings.service.js';
import { logActivity } from './activity.service.js';
import { uploadBuffer, deleteAsset } from './upload.service.js';
import { OPEN_STATUSES, canSubmitNow, isOverdue, publishProblem } from './taskRules.js';
import { BLOCKS_NEW } from './submissionRules.js';
import { recordActivityDay } from './streak.service.js';

const MAX_ATTACHMENTS = 5;
const ELIGIBLE_ROLES = [ROLES.MEMBER, ROLES.MODERATOR];

/* ---------- অ্যাসাইনমেন্ট সিঙ্ক ---------- */
async function resolveTargetUserIds(task) {
  const approved = { status: ACCOUNT_STATUS.APPROVED };
  let ids;
  if (task.assignTo === 'ALL') {
    return (await User.find({ ...approved, role: { $in: ELIGIBLE_ROLES } }).select('_id').lean()).map((u) => u._id);
  }
  if (task.assignTo === 'SELECTED') {
    ids = task.assignedUsers;
  } else {
    const ms = await GroupMembership.find({ group: { $in: task.assignedGroups } }).select('user').lean();
    ids = [...new Set(ms.map((m) => String(m.user)))];
  }
  return (await User.find({ ...approved, _id: { $in: ids } }).select('_id').lean()).map((u) => u._id);
}

async function insertAssignments(taskId, userIds) {
  if (!userIds.length) return;
  try {
    await TaskAssignment.insertMany(userIds.map((user) => ({ task: taskId, user })), { ordered: false });
  } catch (e) {
    // একই (task, user) আগে থেকে থাকলে ডুপ্লিকেট ত্রুটি উপেক্ষা; অন্য ত্রুটি হলে থামে
    const dupOnly = e.code === 11000 || (e.writeErrors?.length && e.writeErrors.every((w) => w.err?.code === 11000 || w.code === 11000));
    if (!dupOnly) throw e;
  }
}

export async function syncTaskAssignments(task) {
  const target = await resolveTargetUserIds(task);
  const targetSet = new Set(target.map(String));
  const existing = await TaskAssignment.find({ task: task._id }).select('user status').lean();
  const existingSet = new Set(existing.map((e) => String(e.user)));

  const added = target.filter((id) => !existingSet.has(String(id)));
  await insertAssignments(task._id, added);

  // যারা আর লক্ষ্যে নেই এবং কাজ শুরুই করেননি, শুধু তাদের অ্যাসাইনমেন্ট সরে যায়
  const removable = existing.filter((e) => !targetSet.has(String(e.user)) && e.status === 'ASSIGNED').map((e) => e.user);
  if (removable.length) await TaskAssignment.deleteMany({ task: task._id, user: { $in: removable }, status: 'ASSIGNED' });
  return { added };
}

async function notifyAssigned(task, userIds) {
  if (!userIds.length) return;
  const settings = await getSettings();
  const users = await User.find({ _id: { $in: userIds } }).select('email fullName').lean();
  for (const u of users) {
    if (settings.notifications.inApp) {
      await createNotification({
        user: u._id, type: 'TASK_ASSIGNED', title: `নতুন টাস্ক: ${task.title}`,
        link: `/dashboard/tasks/${task._id}`, dedupeKey: `task-assigned:${task._id}`,
      });
    }
    if (settings.notifications.emailOnNewTask) {
      // বাল্ক: processNow=false, ওয়ার্কার ব্যাচে পাঠায় (প্রোভাইডারের সীমা রক্ষায়)
      await enqueueEmail({
        to: u.email, type: 'NEW_TASK', processNow: false, dedupeKey: `new-task:${task._id}:${u._id}`,
        data: { name: u.fullName, title: task.title, deadline: task.deadline, taskId: String(task._id) },
      });
    }
  }
}

const stillOpen = (t, now) => !t.deadline || new Date(t.deadline) >= now || t.allowLateSubmission;

// নতুন অনুমোদিত সদস্য প্রকাশিত "সবার জন্য" টাস্কগুলো পায়
export async function assignAllPublishedTasksToUser(user) {
  if (user.status !== ACCOUNT_STATUS.APPROVED || !ELIGIBLE_ROLES.includes(user.role)) return;
  const now = new Date();
  const tasks = (await Task.find({ status: 'PUBLISHED', assignTo: 'ALL' })).filter((t) => stillOpen(t, now));
  for (const t of tasks) {
    await insertAssignments(t._id, [user._id]);
    await notifyAssigned(t, [user._id]);
  }
}

// গ্রুপে নতুন সদস্য যোগ হলে ওই গ্রুপের প্রকাশিত টাস্ক পায়
export async function assignGroupTasksToUsers(groupId, userIds) {
  const now = new Date();
  const tasks = (await Task.find({ status: 'PUBLISHED', assignTo: 'GROUPS', assignedGroups: groupId })).filter((t) => stillOpen(t, now));
  const users = await User.find({ _id: { $in: userIds }, status: ACCOUNT_STATUS.APPROVED }).select('_id').lean();
  const ids = users.map((u) => u._id);
  for (const t of tasks) {
    await insertAssignments(t._id, ids);
    await notifyAssigned(t, ids);
  }
}

/* ---------- অ্যাডমিন ---------- */
async function normalizeAssignees(data) {
  const out = { ...data };
  if (out.assignTo === 'ALL') { out.assignedUsers = []; out.assignedGroups = []; }
  if (out.assignTo === 'SELECTED') {
    out.assignedGroups = [];
    out.assignedUsers = [...new Set(out.assignedUsers)];
    const ok = await User.countDocuments({ _id: { $in: out.assignedUsers }, status: ACCOUNT_STATUS.APPROVED });
    if (ok !== out.assignedUsers.length) throw AppError.badRequest('কিছু নির্বাচিত সদস্য অনুমোদিত নন বা খুঁজে পাওয়া যায়নি');
  }
  if (out.assignTo === 'GROUPS') {
    out.assignedUsers = [];
    out.assignedGroups = [...new Set(out.assignedGroups)];
    const ok = await Group.countDocuments({ _id: { $in: out.assignedGroups } });
    if (ok !== out.assignedGroups.length) throw AppError.badRequest('কিছু নির্বাচিত গ্রুপ খুঁজে পাওয়া যায়নি');
  }
  return out;
}

const loadTask = async (id) => {
  const task = await Task.findById(id);
  if (!task) throw AppError.notFound('টাস্ক পাওয়া যায়নি');
  return task;
};

export async function listAdminTasks(q) {
  const filter = {};
  ['status', 'category', 'priority'].forEach((k) => { if (q[k]) filter[k] = q[k]; });
  if (q.search) filter.title = new RegExp(escapeRegex(q.search), 'i');
  const sort = parseSort(q.sort, ['createdAt', 'deadline', 'title', 'points']);
  const res = await paginate(Task, filter, parsePagination(q, { defaultLimit: 12 }), {
    sort, select: 'title category priority status deadline points assignTo publishedAt createdAt',
  });
  const agg = await TaskAssignment.aggregate([
    { $match: { task: { $in: res.items.map((t) => t._id) } } },
    { $group: { _id: { task: '$task', status: '$status' }, n: { $sum: 1 } } },
  ]);
  const stats = {};
  agg.forEach(({ _id, n }) => {
    const s = (stats[String(_id.task)] ||= { assigned: 0, completed: 0 });
    s.assigned += n;
    if (_id.status === 'COMPLETED') s.completed += n;
  });
  res.items = res.items.map((t) => ({ ...t, stats: stats[String(t._id)] || { assigned: 0, completed: 0 } }));
  return res;
}

export async function getAdminTask(id) {
  const task = await Task.findById(id)
    .populate('assignedUsers', 'fullName username avatar')
    .populate('assignedGroups', 'name')
    .lean();
  if (!task) throw AppError.notFound('টাস্ক পাওয়া যায়নি');
  const now = new Date();
  const [assignments, submissionCount] = await Promise.all([
    TaskAssignment.find({ task: id }).populate('user', 'fullName username avatar').sort('-updatedAt').limit(500).lean(),
    Submission.countDocuments({ task: id }),
  ]);
  const counts = { ASSIGNED: 0, IN_PROGRESS: 0, SUBMITTED: 0, COMPLETED: 0, OVERDUE: 0 };
  const rows = assignments.map((a) => {
    const overdue = isOverdue(a.status, task.deadline, now);
    counts[a.status] = (counts[a.status] || 0) + 1;
    return { ...a, isOverdue: overdue };
  });
  return { task, counts, total: assignments.length, overdue: rows.filter((r) => r.isOverdue).length, assignments: rows, submissionCount };
}

export async function createTask(data, actor, req) {
  const clean = await normalizeAssignees(data);
  const task = await Task.create({ ...clean, createdBy: actor._id, status: 'DRAFT' });
  await logActivity({ actor: actor._id, action: 'TASK_CREATED', targetType: 'Task', targetId: task._id, metadata: { title: task.title }, req, isAudit: true });
  return getAdminTask(task._id);
}

export async function updateTask(id, data, actor, req) {
  const task = await loadTask(id);
  const clean = await normalizeAssignees(data);
  const oldDeadline = task.deadline ? new Date(task.deadline).getTime() : null;
  task.set(clean);
  const newDeadline = task.deadline ? new Date(task.deadline).getTime() : null;
  if (oldDeadline !== newDeadline) task.reminderSentAt = undefined; // ডেডলাইন বদলালে রিমাইন্ডার আবার যাবে
  await task.save();
  if (task.status === 'PUBLISHED') {
    const { added } = await syncTaskAssignments(task);
    await notifyAssigned(task, added);
  }
  await logActivity({ actor: actor._id, action: 'TASK_UPDATED', targetType: 'Task', targetId: task._id, metadata: { title: task.title }, req, isAudit: true });
  return getAdminTask(id);
}

export async function publishTask(id, actor, req) {
  const task = await loadTask(id);
  if (task.status !== 'DRAFT') throw AppError.badRequest('শুধু ড্রাফট টাস্ক প্রকাশ করা যায়');
  const problem = publishProblem(task);
  if (problem) throw AppError.badRequest(problem);
  task.status = 'PUBLISHED';
  task.publishedAt = new Date();
  await task.save();
  const { added } = await syncTaskAssignments(task);
  await notifyAssigned(task, added);
  await logActivity({ actor: actor._id, action: 'TASK_PUBLISHED', targetType: 'Task', targetId: task._id, metadata: { title: task.title, assignees: added.length }, req, isAudit: true });
  return getAdminTask(id);
}

export async function unpublishTask(id, actor, req) {
  const task = await loadTask(id);
  if (task.status !== 'PUBLISHED') throw AppError.badRequest('টাস্কটি প্রকাশিত নয়');
  if (await Submission.exists({ task: task._id })) throw AppError.conflict('এই টাস্কে সাবমিশন আছে, তাই ড্রাফটে ফেরানো যাবে না। বরং টাস্কটি বন্ধ করুন।');
  task.status = 'DRAFT';
  await task.save();
  await logActivity({ actor: actor._id, action: 'TASK_UNPUBLISHED', targetType: 'Task', targetId: task._id, metadata: { title: task.title }, req, isAudit: true });
  return getAdminTask(id);
}

export async function closeTask(id, actor, req) {
  const task = await loadTask(id);
  if (task.status !== 'PUBLISHED') throw AppError.badRequest('শুধু প্রকাশিত টাস্ক বন্ধ করা যায়');
  task.status = 'CLOSED';
  await task.save();
  await logActivity({ actor: actor._id, action: 'TASK_CLOSED', targetType: 'Task', targetId: task._id, metadata: { title: task.title }, req, isAudit: true });
  return getAdminTask(id);
}

export async function reopenTask(id, { deadline }, actor, req) {
  const task = await loadTask(id);
  if (task.status !== 'CLOSED') throw AppError.badRequest('শুধু বন্ধ টাস্ক আবার খোলা যায়');
  if (deadline !== undefined) { task.deadline = deadline; task.reminderSentAt = undefined; }
  const problem = publishProblem({ ...task.toObject(), status: 'PUBLISHED' });
  if (problem) throw AppError.badRequest(problem);
  task.status = 'PUBLISHED';
  await task.save();
  const { added } = await syncTaskAssignments(task);
  await notifyAssigned(task, added);
  await logActivity({ actor: actor._id, action: 'TASK_REOPENED', targetType: 'Task', targetId: task._id, metadata: { title: task.title }, req, isAudit: true });
  return getAdminTask(id);
}

export async function deleteTask(id, actor, req) {
  const task = await loadTask(id);
  if (await Submission.exists({ task: task._id })) throw AppError.conflict('এই টাস্কে সাবমিশন আছে, তাই মোছা যাবে না। টাস্কটি বন্ধ (Close) করুন।');
  for (const a of task.attachments) await deleteAsset(a.publicId, a.mimeType?.startsWith('image/'));
  await TaskAssignment.deleteMany({ task: task._id });
  await Task.deleteOne({ _id: task._id });
  await logActivity({ actor: actor._id, action: 'TASK_DELETED', metadata: { title: task.title }, req, isAudit: true });
}

export async function addAttachment(id, file, actor, req) {
  const task = await loadTask(id);
  if (task.attachments.length >= MAX_ATTACHMENTS) throw AppError.badRequest(`একটি টাস্কে সর্বোচ্চ ${MAX_ATTACHMENTS}টি ফাইল সংযুক্ত করা যায়`);
  const image = file.mimetype.startsWith('image/');
  const ext = path.extname(file.originalname).toLowerCase();
  const uploaded = await uploadBuffer(file.buffer, {
    folder: `devforge/tasks/${task._id}`, publicId: `${randomToken(8)}${image ? '' : ext}`, image,
  });
  task.attachments.push({
    name: file.originalname.replace(/[\u0000-\u001f]/g, '').slice(0, 120),
    url: uploaded.url, publicId: uploaded.publicId, size: file.size, mimeType: file.mimetype,
  });
  await task.save();
  await logActivity({ actor: actor._id, action: 'TASK_ATTACHMENT_ADDED', targetType: 'Task', targetId: task._id, req, isAudit: true });
  return getAdminTask(id);
}

export async function removeAttachment(id, publicId, actor, req) {
  const task = await loadTask(id);
  const att = task.attachments.find((a) => a.publicId === publicId);
  if (!att) throw AppError.notFound('ফাইলটি পাওয়া যায়নি');
  await deleteAsset(att.publicId, att.mimeType?.startsWith('image/'));
  task.attachments = task.attachments.filter((a) => a.publicId !== publicId);
  await task.save();
  await logActivity({ actor: actor._id, action: 'TASK_ATTACHMENT_REMOVED', targetType: 'Task', targetId: task._id, req, isAudit: true });
  return getAdminTask(id);
}

/* ---------- সদস্য ---------- */
export async function listMemberTasks(user, q) {
  const { page, limit, skip } = parsePagination(q, { defaultLimit: 12 });
  const now = new Date();
  const NEVER = new Date('9999-12-31');
  const open = { $in: OPEN_STATUSES };

  const stages = [
    { $match: { user: user._id } },
    { $lookup: { from: 'tasks', localField: 'task', foreignField: '_id', as: 'task' } },
    { $unwind: '$task' },
    { $match: { 'task.status': { $in: ['PUBLISHED', 'CLOSED'] } } },
  ];
  if (q.category) stages.push({ $match: { 'task.category': q.category } });
  if (q.search) stages.push({ $match: { 'task.title': new RegExp(escapeRegex(q.search), 'i') } });
  if (q.filter === 'pending') stages.push({ $match: { status: open, $or: [{ 'task.deadline': null }, { 'task.deadline': { $gte: now } }] } });
  if (q.filter === 'overdue') stages.push({ $match: { status: open, 'task.deadline': { $lt: now } } });
  if (q.filter === 'submitted') stages.push({ $match: { status: 'SUBMITTED' } });
  if (q.filter === 'completed') stages.push({ $match: { status: 'COMPLETED' } });

  stages.push(
    { $addFields: { sortKey: { $ifNull: ['$task.deadline', NEVER] } } },
    { $sort: q.sort === 'newest' ? { createdAt: -1 } : { sortKey: 1, createdAt: -1 } },
    {
      $facet: {
        items: [
          { $skip: skip }, { $limit: limit },
          { $project: {
            status: 1, createdAt: 1,
            'task._id': 1, 'task.title': 1, 'task.category': 1, 'task.priority': 1, 'task.deadline': 1,
            'task.points': 1, 'task.status': 1, 'task.allowLateSubmission': 1,
          } },
        ],
        total: [{ $count: 'n' }],
      },
    }
  );
  const [r] = await TaskAssignment.aggregate(stages);
  const total = r.total[0]?.n || 0;
  return {
    items: r.items.map((a) => ({ ...a, isOverdue: isOverdue(a.status, a.task.deadline, now) })),
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}

export async function getMemberTask(user, taskId) {
  const [assignment, task, submissions] = await Promise.all([
    TaskAssignment.findOne({ task: taskId, user: user._id }).lean(),
    Task.findById(taskId).select('-assignedUsers -assignedGroups -createdBy -reminderSentAt').lean(),
    Submission.find({ task: taskId, user: user._id }).sort('-createdAt').select('title status version createdAt').lean(),
  ]);
  if (!assignment || !task || task.status === 'DRAFT') throw AppError.notFound('টাস্কটি পাওয়া যায়নি');
  const now = new Date();
  return {
    task, assignment, submissions,
    isOverdue: isOverdue(assignment.status, task.deadline, now),
    // নতুন সাবমিশন দেওয়া যাবে: সময় থাকলে এবং আগের কোনো সাবমিশন চালু/অনুমোদিত না থাকলে
    canSubmit: canSubmitNow(task, now) && !submissions.some((s) => BLOCKS_NEW.includes(s.status)),
  };
}

export async function startTask(user, taskId) {
  const task = await Task.findById(taskId).select('status');
  if (!task || task.status !== 'PUBLISHED') throw AppError.badRequest('এই টাস্ক এখন শুরু করা যাবে না');
  const r = await TaskAssignment.updateOne(
    { task: taskId, user: user._id, status: 'ASSIGNED' },
    { $set: { status: 'IN_PROGRESS', startedAt: new Date() } }
  );
  if (!r.matchedCount) {
    if (!(await TaskAssignment.exists({ task: taskId, user: user._id }))) throw AppError.notFound('টাস্কটি আপনার জন্য নয়');
    throw AppError.badRequest('টাস্কটি ইতিমধ্যে শুরু করা হয়েছে');
  }
  recordActivityDay(user._id); // কাজ শুরু = শেখার দিন
  return getMemberTask(user, taskId);
}
