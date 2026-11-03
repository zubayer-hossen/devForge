import { Announcement, GroupMembership, User } from '../models/index.js';
import { ACCOUNT_STATUS, ROLES } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, paginate, parsePagination } from '../utils/pagination.js';
import { enqueueEmail } from './email/email.service.js';
import { createNotification } from './notification.service.js';
import { getSettings } from './settings.service.js';
import { logActivity } from './activity.service.js';
import { canTransition, scheduleProblem, visibleToUser } from './announcementRules.js';

const isAdminRole = (role) => role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;

async function loadAnnouncement(id) {
  const a = await Announcement.findById(id);
  if (!a) throw AppError.notFound('ঘোষণা পাওয়া যায়নি');
  return a;
}

async function recipients(a) {
  const approved = { status: ACCOUNT_STATUS.APPROVED };
  if (a.audienceGroups?.length) {
    const ms = await GroupMembership.find({ group: { $in: a.audienceGroups } }).select('user').lean();
    const ids = [...new Set(ms.map((m) => String(m.user)))];
    return User.find({ ...approved, _id: { $in: ids } }).select('email fullName').lean();
  }
  return User.find({ ...approved, role: { $in: [ROLES.MEMBER, ROLES.MODERATOR] } }).select('email fullName').lean();
}

// নোটিফিকেশন ও ইমেইল dedupeKey দিয়ে সুরক্ষিত: আবার প্রকাশ করলেও কেউ দুইবার পায় না
async function deliver(a) {
  const settings = await getSettings();
  const users = await recipients(a);
  for (const u of users) {
    if (settings.notifications.inApp) {
      await createNotification({
        user: u._id, type: 'ANNOUNCEMENT', title: a.title, message: a.body.slice(0, 160),
        link: '/dashboard/announcements', dedupeKey: `announcement:${a._id}`,
      });
    }
    if (a.sendEmail) {
      await enqueueEmail({
        to: u.email, type: 'ANNOUNCEMENT', processNow: false, dedupeKey: `announcement:${a._id}:${u._id}`,
        data: { name: u.fullName, title: a.title, body: a.body },
      });
    }
  }
  return users.length;
}

/* ---------- অ্যাডমিন ---------- */
export async function listAdmin(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.search) filter.title = new RegExp(escapeRegex(q.search), 'i');
  return paginate(Announcement, filter, parsePagination(q, { defaultLimit: 12 }), {
    sort: '-pinned -createdAt', populate: { path: 'audienceGroups', select: 'name' },
  });
}

export async function createAnnouncement(data, actor, req) {
  const a = await Announcement.create({ ...data, status: 'DRAFT', createdBy: actor._id });
  await logActivity({ actor: actor._id, action: 'ANNOUNCEMENT_CREATED', targetType: 'Announcement', targetId: a._id, metadata: { title: a.title }, req, isAudit: true });
  return a.toObject();
}

export async function updateAnnouncement(id, data, actor, req) {
  const a = await loadAnnouncement(id);
  a.set(data);
  await a.save();
  await logActivity({ actor: actor._id, action: 'ANNOUNCEMENT_UPDATED', targetType: 'Announcement', targetId: a._id, metadata: { title: a.title }, req, isAudit: true });
  return a.toObject();
}

export async function deleteAnnouncement(id, actor, req) {
  const a = await loadAnnouncement(id);
  await Announcement.deleteOne({ _id: id });
  await logActivity({ actor: actor._id, action: 'ANNOUNCEMENT_DELETED', metadata: { title: a.title }, req, isAudit: true });
}

// actor = null হলে শিডিউলার (সিস্টেম)
export async function publishAnnouncement(id, actor, req) {
  // অ্যাটমিক দখল: একাধিক সার্ভার/অনুরোধ একসঙ্গে চললেও একবারই প্রকাশ হয়
  const claimed = await Announcement.findOneAndUpdate(
    { _id: id, status: { $in: ['DRAFT', 'SCHEDULED'] } },
    { $set: { status: 'PUBLISHED', publishedAt: new Date() }, $unset: { publishAt: 1 } },
    { new: true }
  );
  if (!claimed) {
    if (!(await Announcement.exists({ _id: id }))) throw AppError.notFound('ঘোষণা পাওয়া যায়নি');
    throw AppError.conflict('ঘোষণাটি এখন প্রকাশ করা যাবে না (ইতিমধ্যে প্রকাশিত)');
  }
  const count = await deliver(claimed);
  await logActivity({
    actor: actor?._id, action: 'ANNOUNCEMENT_PUBLISHED', targetType: 'Announcement', targetId: claimed._id,
    metadata: { title: claimed.title, recipients: count, scheduled: !actor }, req, isAudit: true,
  });
  return claimed.toObject();
}

export async function scheduleAnnouncement(id, { publishAt }, actor, req) {
  const problem = scheduleProblem(publishAt);
  if (problem) throw AppError.badRequest(problem);
  const a = await loadAnnouncement(id);
  if (!canTransition(a.status, 'schedule')) throw AppError.conflict('এই ঘোষণার সময় নির্ধারণ করা যাবে না');
  a.status = 'SCHEDULED';
  a.publishAt = publishAt;
  await a.save();
  await logActivity({ actor: actor._id, action: 'ANNOUNCEMENT_SCHEDULED', targetType: 'Announcement', targetId: a._id, metadata: { title: a.title, publishAt }, req, isAudit: true });
  return a.toObject();
}

export async function unscheduleAnnouncement(id, actor, req) {
  const a = await loadAnnouncement(id);
  if (!canTransition(a.status, 'unschedule')) throw AppError.conflict('ঘোষণাটি নির্ধারিত অবস্থায় নেই');
  a.status = 'DRAFT';
  a.publishAt = undefined;
  await a.save();
  await logActivity({ actor: actor._id, action: 'ANNOUNCEMENT_UNSCHEDULED', targetType: 'Announcement', targetId: a._id, metadata: { title: a.title }, req, isAudit: true });
  return a.toObject();
}

export async function unpublishAnnouncement(id, actor, req) {
  const a = await loadAnnouncement(id);
  if (!canTransition(a.status, 'unpublish')) throw AppError.conflict('ঘোষণাটি প্রকাশিত নয়');
  a.status = 'DRAFT';
  await a.save();
  await logActivity({ actor: actor._id, action: 'ANNOUNCEMENT_UNPUBLISHED', targetType: 'Announcement', targetId: a._id, metadata: { title: a.title }, req, isAudit: true });
  return a.toObject();
}

/* ---------- সদস্য ---------- */
export async function listForMember(user, q) {
  const filter = { status: 'PUBLISHED' };
  if (!isAdminRole(user.role)) {
    const groupIds = (await GroupMembership.find({ user: user._id }).select('group').lean()).map((g) => g.group);
    filter.$or = [{ audienceGroups: { $size: 0 } }, { audienceGroups: { $in: groupIds } }];
  }
  return paginate(Announcement, filter, parsePagination(q, { defaultLimit: 10 }), {
    sort: '-pinned -publishedAt', select: 'title body pinned publishedAt', populate: { path: 'createdBy', select: 'fullName' },
  });
}

export { visibleToUser };
