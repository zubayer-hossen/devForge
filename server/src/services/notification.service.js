import { Notification, User } from '../models/index.js';
import { ROLES, ACCOUNT_STATUS } from '../constants/index.js';
import { paginate, parsePagination } from '../utils/pagination.js';
import { emitToUser } from '../sockets/emitter.js';

export async function createNotification({ user, type, title, message = '', link, dedupeKey }) {
  try {
    if (dedupeKey && (await Notification.exists({ user, dedupeKey }))) return null; // একই নোটিফিকেশন দুইবার নয়
    const n = await Notification.create({ user, type, title, message, link, ...(dedupeKey ? { dedupeKey } : {}) });
    emitToUser(user, 'notification', {
      _id: n._id, type: n.type, title: n.title, message: n.message, link: n.link, isRead: false, createdAt: n.createdAt,
    });
    return n;
  } catch (e) {
    console.error('নোটিফিকেশন তৈরি ব্যর্থ:', e.message);
    return null;
  }
}

export async function getAdmins() {
  return User.find({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }, status: ACCOUNT_STATUS.APPROVED })
    .select('email fullName').lean();
}

export async function notifyAdmins({ type, title, message, link }) {
  const admins = await getAdmins();
  await Promise.all(admins.map((a) => createNotification({ user: a._id, type, title, message, link })));
  return admins;
}

/* ---------- পড়া/ইতিহাস ---------- */
export const unreadCount = (userId) => Notification.countDocuments({ user: userId, isRead: false });

export async function listNotifications(user, q) {
  const filter = { user: user._id };
  if (q.unread) filter.isRead = false;
  const res = await paginate(Notification, filter, parsePagination(q, { defaultLimit: 15 }), {
    sort: '-createdAt', select: 'type title message link isRead createdAt',
  });
  return { ...res, unread: await unreadCount(user._id) };
}

export async function markRead(user, id) {
  await Notification.updateOne({ _id: id, user: user._id, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
  return { unread: await unreadCount(user._id) };
}

export async function markAllRead(user) {
  await Notification.updateMany({ user: user._id, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
  return { unread: 0 };
}
