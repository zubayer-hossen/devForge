import {
  User, TaskAssignment, Announcement, Resource, Submission, GroupMembership,
} from '../models/index.js';
import { ACCOUNT_STATUS, ROLES } from '../constants/index.js';
import { uploadBuffer, deleteAsset } from './upload.service.js';
import { logActivity } from './activity.service.js';
import { dhakaDay, effectiveCurrent } from './streakRules.js';

export async function getDashboard(user) {
  const now = new Date();
  const groupIds = (await GroupMembership.find({ user: user._id }).select('group').lean()).map((g) => g.group);

  const [assignAgg, pendingAssignments, announcements, resources, submissions, ahead, ranked] = await Promise.all([
    TaskAssignment.aggregate([{ $match: { user: user._id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    TaskAssignment.find({ user: user._id, status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } })
      .populate({ path: 'task', match: { status: 'PUBLISHED' }, select: 'title deadline priority category points' })
      .limit(200).lean(),
    Announcement.find({
      status: 'PUBLISHED',
      $or: [{ audienceGroups: { $size: 0 } }, { audienceGroups: { $in: groupIds } }],
    }).sort('-pinned -publishedAt').limit(5).select('title body pinned publishedAt').lean(),
    Resource.find({}).sort('-pinned -createdAt').limit(5).select('title type url pinned file').lean(),
    Submission.find({ user: user._id }).sort('-createdAt').limit(5).select('title status createdAt pointsAwarded').lean(),
    user.role === ROLES.MEMBER
      ? User.countDocuments({ status: ACCOUNT_STATUS.APPROVED, role: ROLES.MEMBER, points: { $gt: user.points } })
      : null,
    User.countDocuments({ status: ACCOUNT_STATUS.APPROVED, role: ROLES.MEMBER }),
  ]);

  const counts = { ASSIGNED: 0, IN_PROGRESS: 0, SUBMITTED: 0, COMPLETED: 0, OVERDUE: 0 };
  assignAgg.forEach((r) => { counts[r._id] = r.n; });

  const open = pendingAssignments.filter((a) => a.task);
  const withDeadline = open.filter((a) => a.task.deadline);
  const upcoming = withDeadline.filter((a) => new Date(a.task.deadline) >= now)
    .sort((a, b) => new Date(a.task.deadline) - new Date(b.task.deadline)).slice(0, 5)
    .map((a) => ({ assignmentId: a._id, ...a.task }));
  const overdue = withDeadline.filter((a) => new Date(a.task.deadline) < now).length;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return {
    tasks: {
      assigned: total, completed: counts.COMPLETED, pending: open.length,
      submitted: counts.SUBMITTED, overdue: Math.max(overdue, counts.OVERDUE),
    },
    upcoming,
    announcements,
    resources,
    submissions,
    points: user.points,
    streak: { current: effectiveCurrent(user.streak || {}, dhakaDay()), longest: user.streak?.longest || 0 },
    leaderboard: { rank: ahead === null ? null : ahead + 1, total: ranked },
  };
}

export async function updateProfile(user, data, req) {
  const $set = {}; const $unset = {};
  Object.entries(data).forEach(([k, v]) => {
    if (v === '' && (k === 'githubUrl' || k === 'portfolioUrl')) $unset[k] = 1; else $set[k] = v;
  });
  await User.updateOne({ _id: user._id }, {
    ...(Object.keys($set).length ? { $set } : {}),
    ...(Object.keys($unset).length ? { $unset } : {}),
  });
  await logActivity({ actor: user._id, action: 'PROFILE_UPDATED', targetType: 'User', targetId: user._id, metadata: { fields: Object.keys(data) }, req });
  return (await User.findById(user._id)).toSafeJSON();
}

export async function setAvatar(user, file, req) {
  const uploaded = await uploadBuffer(file.buffer, {
    folder: 'devforge/avatars', publicId: String(user._id), image: true,
    transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }, { quality: 'auto' }],
  });
  await User.updateOne({ _id: user._id }, { $set: { avatar: { url: uploaded.url, publicId: uploaded.publicId } } });
  await logActivity({ actor: user._id, action: 'PROFILE_AVATAR_UPDATED', targetType: 'User', targetId: user._id, req });
  return (await User.findById(user._id)).toSafeJSON();
}

export async function removeAvatar(user, req) {
  await deleteAsset(user.avatar?.publicId);
  await User.updateOne({ _id: user._id }, { $unset: { avatar: 1 } });
  await logActivity({ actor: user._id, action: 'PROFILE_AVATAR_REMOVED', targetType: 'User', targetId: user._id, req });
  return (await User.findById(user._id)).toSafeJSON();
}
