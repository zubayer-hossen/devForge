import { Group, GroupMembership, Task, User } from '../models/index.js';
import { ACCOUNT_STATUS } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex } from '../utils/pagination.js';
import { logActivity } from './activity.service.js';
import { assignGroupTasksToUsers } from './task.service.js';

const recount = async (groupId) => {
  const n = await GroupMembership.countDocuments({ group: groupId });
  await Group.updateOne({ _id: groupId }, { $set: { memberCount: n } });
  return n;
};

async function loadGroup(id) {
  const g = await Group.findById(id);
  if (!g) throw AppError.notFound('গ্রুপ পাওয়া যায়নি');
  return g;
}

export async function listGroups() {
  return Group.find({}).sort('name').lean();
}

export async function getGroup(id) {
  const group = await Group.findById(id).lean();
  if (!group) throw AppError.notFound('গ্রুপ পাওয়া যায়নি');
  const memberships = await GroupMembership.find({ group: id }).sort('-createdAt')
    .populate('user', 'fullName username email avatar status').lean();
  return { group, members: memberships.filter((m) => m.user).map((m) => ({ ...m.user, joinedAt: m.createdAt })) };
}

export async function createGroup(data, actor, req) {
  if (await Group.exists({ name: new RegExp(`^${escapeRegex(data.name)}$`, 'i') })) {
    throw AppError.conflict('এই নামে একটি গ্রুপ আগেই আছে');
  }
  const group = await Group.create({ ...data, createdBy: actor._id });
  await logActivity({ actor: actor._id, action: 'GROUP_CREATED', targetType: 'Group', targetId: group._id, metadata: { name: group.name }, req, isAudit: true });
  return group.toObject();
}

export async function updateGroup(id, data, actor, req) {
  const group = await loadGroup(id);
  const clash = await Group.exists({ _id: { $ne: id }, name: new RegExp(`^${escapeRegex(data.name)}$`, 'i') });
  if (clash) throw AppError.conflict('এই নামে একটি গ্রুপ আগেই আছে');
  group.set(data);
  await group.save();
  await logActivity({ actor: actor._id, action: 'GROUP_UPDATED', targetType: 'Group', targetId: group._id, metadata: { name: group.name }, req, isAudit: true });
  return group.toObject();
}

export async function deleteGroup(id, actor, req) {
  const group = await loadGroup(id);
  await GroupMembership.deleteMany({ group: id });
  await Task.updateMany({ assignedGroups: id }, { $pull: { assignedGroups: id } });
  await Group.deleteOne({ _id: id });
  await logActivity({ actor: actor._id, action: 'GROUP_DELETED', metadata: { name: group.name }, req, isAudit: true });
}

export async function addMembers(id, { userIds }, actor, req) {
  const group = await loadGroup(id);
  const unique = [...new Set(userIds)];
  const users = await User.find({ _id: { $in: unique }, status: ACCOUNT_STATUS.APPROVED }).select('_id').lean();
  if (users.length !== unique.length) throw AppError.badRequest('শুধু অনুমোদিত সদস্যকে গ্রুপে যোগ করা যায়');

  const existing = new Set((await GroupMembership.find({ group: id, user: { $in: unique } }).select('user').lean()).map((m) => String(m.user)));
  const fresh = unique.filter((u) => !existing.has(String(u)));
  if (fresh.length) {
    await GroupMembership.insertMany(fresh.map((user) => ({ group: id, user, addedBy: actor._id })), { ordered: false });
    await assignGroupTasksToUsers(id, fresh); // গ্রুপের প্রকাশিত টাস্ক নতুন সদস্যরা পায়
  }
  await recount(id);
  await logActivity({ actor: actor._id, action: 'GROUP_MEMBERS_ADDED', targetType: 'Group', targetId: group._id, metadata: { name: group.name, count: fresh.length }, req, isAudit: true });
  return getGroup(id);
}

export async function removeMember(id, userId, actor, req) {
  const group = await loadGroup(id);
  const r = await GroupMembership.deleteOne({ group: id, user: userId });
  if (!r.deletedCount) throw AppError.notFound('সদস্যটি এই গ্রুপে নেই');
  await recount(id);
  await logActivity({ actor: actor._id, action: 'GROUP_MEMBER_REMOVED', targetType: 'Group', targetId: group._id, metadata: { name: group.name }, req, isAudit: true });
  return getGroup(id);
}
