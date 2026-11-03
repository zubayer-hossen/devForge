import * as tasks from '../services/task.service.js';
import * as groups from '../services/group.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

const A = (fn, msg, status) => asyncHandler(async (req, res) => ok(res, await fn(req), msg, status));

/* অ্যাডমিন: টাস্ক */
export const adminList = A((r) => tasks.listAdminTasks(r.query));
export const adminGet = A((r) => tasks.getAdminTask(r.params.id));
export const adminCreate = A((r) => tasks.createTask(r.body, r.user, r), 'টাস্ক ড্রাফট হিসেবে সংরক্ষিত হয়েছে', 201);
export const adminUpdate = A((r) => tasks.updateTask(r.params.id, r.body, r.user, r), 'টাস্ক হালনাগাদ হয়েছে');
export const adminPublish = A((r) => tasks.publishTask(r.params.id, r.user, r), 'টাস্ক প্রকাশিত হয়েছে');
export const adminUnpublish = A((r) => tasks.unpublishTask(r.params.id, r.user, r), 'টাস্ক ড্রাফটে ফেরানো হয়েছে');
export const adminClose = A((r) => tasks.closeTask(r.params.id, r.user, r), 'টাস্ক বন্ধ করা হয়েছে');
export const adminReopen = A((r) => tasks.reopenTask(r.params.id, r.body, r.user, r), 'টাস্ক আবার খোলা হয়েছে');
export const adminDelete = asyncHandler(async (req, res) => {
  await tasks.deleteTask(req.params.id, req.user, req);
  ok(res, null, 'টাস্ক মুছে ফেলা হয়েছে');
});
export const adminAddAttachment = A((r) => tasks.addAttachment(r.params.id, r.file, r.user, r), 'ফাইল সংযুক্ত হয়েছে');
export const adminRemoveAttachment = A((r) => tasks.removeAttachment(r.params.id, r.query.publicId, r.user, r), 'ফাইল সরানো হয়েছে');

/* অ্যাডমিন: গ্রুপ */
export const groupList = A(() => groups.listGroups());
export const groupGet = A((r) => groups.getGroup(r.params.id));
export const groupCreate = A((r) => groups.createGroup(r.body, r.user, r), 'গ্রুপ তৈরি হয়েছে', 201);
export const groupUpdate = A((r) => groups.updateGroup(r.params.id, r.body, r.user, r), 'গ্রুপ হালনাগাদ হয়েছে');
export const groupDelete = asyncHandler(async (req, res) => {
  await groups.deleteGroup(req.params.id, req.user, req);
  ok(res, null, 'গ্রুপ মুছে ফেলা হয়েছে');
});
export const groupAddMembers = A((r) => groups.addMembers(r.params.id, r.body, r.user, r), 'সদস্য যোগ করা হয়েছে');
export const groupRemoveMember = A((r) => groups.removeMember(r.params.id, r.params.userId, r.user, r), 'সদস্য সরানো হয়েছে');

/* সদস্য */
export const memberList = A((r) => tasks.listMemberTasks(r.user, r.query));
export const memberGet = A((r) => tasks.getMemberTask(r.user, r.params.taskId));
export const memberStart = A((r) => tasks.startTask(r.user, r.params.taskId), 'টাস্ক শুরু করা হয়েছে');
