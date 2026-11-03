import * as notif from '../services/notification.service.js';
import { getLeaderboard } from '../services/leaderboard.service.js';
import { getProgress } from '../services/progress.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

const A = (fn, msg) => asyncHandler(async (req, res) => ok(res, await fn(req), msg));

export const notifications = A((r) => notif.listNotifications(r.user, r.query));
export const unread = A(async (r) => ({ unread: await notif.unreadCount(r.user._id) }));
export const readOne = A((r) => notif.markRead(r.user, r.params.id));
export const readAll = A((r) => notif.markAllRead(r.user), 'সব নোটিফিকেশন পড়া হয়েছে');
export const leaderboard = A((r) => getLeaderboard(r.user, r.query));
export const progress = A((r) => getProgress(r.user));
