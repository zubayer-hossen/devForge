import * as svc from '../services/submission.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

const A = (fn, msg, status) => asyncHandler(async (req, res) => ok(res, await fn(req), msg, status));

export const create = A((r) => svc.createSubmission(r.user, r.body, r), 'সাবমিশন জমা হয়েছে', 201);
export const update = A((r) => svc.updateSubmission(r.user, r.params.id, r.body, r), 'সাবমিশন হালনাগাদ হয়েছে');
export const mine = A((r) => svc.listMine(r.user, r.query));
export const mineOne = A((r) => svc.getMine(r.user, r.params.id));
export const addScreenshot = A((r) => svc.addMedia(r.user, r.params.id, 'screenshots', r.file, r), 'স্ক্রিনশট যোগ হয়েছে');
export const addFile = A((r) => svc.addMedia(r.user, r.params.id, 'files', r.file, r), 'ফাইল যোগ হয়েছে');
export const removeMedia = A((r) => svc.removeMedia(r.user, r.params.id, r.query.kind, r.query.publicId, r), 'ফাইল সরানো হয়েছে');

export const adminList = A((r) => svc.listAdmin(r.query));
export const adminOne = A((r) => svc.getAdmin(r.params.id));
export const adminStart = A((r) => svc.startReview(r.params.id, r.user, r), 'রিভিউ শুরু হয়েছে');
export const adminReview = A((r) => svc.reviewSubmission(r.params.id, r.body, r.user, r), 'রিভিউ সংরক্ষিত হয়েছে');
