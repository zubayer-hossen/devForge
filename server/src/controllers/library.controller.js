import * as resources from '../services/resource.service.js';
import * as ann from '../services/announcement.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

const A = (fn, msg, status) => asyncHandler(async (req, res) => ok(res, await fn(req), msg, status));

export const resourceList = A((r) => resources.listResources(r.query));
export const resourceMeta = A(() => resources.resourceMeta());
export const resourceCreate = A((r) => resources.createResource(r.body, r.file, r.user, r), 'রিসোর্স যোগ হয়েছে', 201);
export const resourceUpdate = A((r) => resources.updateResource(r.params.id, r.body, r.file, r.user, r), 'রিসোর্স হালনাগাদ হয়েছে');
export const resourceDelete = asyncHandler(async (req, res) => {
  await resources.deleteResource(req.params.id, req.user, req);
  ok(res, null, 'রিসোর্স মুছে ফেলা হয়েছে');
});

export const annAdminList = A((r) => ann.listAdmin(r.query));
export const annCreate = A((r) => ann.createAnnouncement(r.body, r.user, r), 'ঘোষণা ড্রাফট হিসেবে সংরক্ষিত হয়েছে', 201);
export const annUpdate = A((r) => ann.updateAnnouncement(r.params.id, r.body, r.user, r), 'ঘোষণা হালনাগাদ হয়েছে');
export const annDelete = asyncHandler(async (req, res) => {
  await ann.deleteAnnouncement(req.params.id, req.user, req);
  ok(res, null, 'ঘোষণা মুছে ফেলা হয়েছে');
});
export const annPublish = A((r) => ann.publishAnnouncement(r.params.id, r.user, r), 'ঘোষণা প্রকাশিত হয়েছে');
export const annSchedule = A((r) => ann.scheduleAnnouncement(r.params.id, r.body, r.user, r), 'ঘোষণা নির্ধারিত সময়ের জন্য রাখা হয়েছে');
export const annUnschedule = A((r) => ann.unscheduleAnnouncement(r.params.id, r.user, r), 'নির্ধারিত প্রকাশ বাতিল হয়েছে');
export const annUnpublish = A((r) => ann.unpublishAnnouncement(r.params.id, r.user, r), 'ঘোষণা ড্রাফটে ফেরানো হয়েছে');
export const annMemberList = A((r) => ann.listForMember(r.user, r.query));
