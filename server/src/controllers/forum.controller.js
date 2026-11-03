import * as svc from '../services/forum.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

const A = (fn, msg, status) => asyncHandler(async (req, res) => ok(res, await fn(req), msg, status));
const done = (fn, msg) => asyncHandler(async (req, res) => { await fn(req); ok(res, null, msg); });

export const tags = A(() => svc.popularTags());
export const list = A((r) => svc.listPosts(r.user, r.query));
export const get = A((r) => svc.getPost(r.user, r.params.id));
export const create = A((r) => svc.createPost(r.user, r.body), 'পোস্ট প্রকাশিত হয়েছে', 201);
export const update = A((r) => svc.updatePost(r.user, r.params.id, r.body), 'পোস্ট হালনাগাদ হয়েছে');
export const remove = done((r) => svc.deletePost(r.user, r.params.id, r), 'পোস্ট মুছে ফেলা হয়েছে');

export const likePost = A((r) => svc.likePost(r.user, r.params.id));
export const bookmark = A((r) => svc.bookmarkPost(r.user, r.params.id));
export const reportPost = done((r) => svc.reportPost(r.user, r.params.id, r.body), 'রিপোর্ট জমা হয়েছে। মডারেটররা দেখবেন।');

export const addComment = A((r) => svc.createComment(r.user, r.params.id, r.body), 'মন্তব্য যোগ হয়েছে', 201);
export const editComment = A((r) => svc.updateComment(r.user, r.params.id, r.body), 'মন্তব্য হালনাগাদ হয়েছে');
export const removeComment = A((r) => svc.deleteComment(r.user, r.params.id, r), 'মন্তব্য মুছে ফেলা হয়েছে');
export const likeComment = A((r) => svc.likeComment(r.user, r.params.id));
export const reportComment = done((r) => svc.reportComment(r.user, r.params.id, r.body), 'রিপোর্ট জমা হয়েছে। মডারেটররা দেখবেন।');

export const accept = A((r) => svc.acceptAnswer(r.user, r.params.id, r.body), 'উত্তর গ্রহণ করা হয়েছে');
export const unaccept = A((r) => svc.unacceptAnswer(r.user, r.params.id), 'উত্তর গ্রহণ বাতিল হয়েছে');

export const hidePost = A((r) => svc.hidePost(r.user, r.params.id, r.body, r), 'সম্পন্ন হয়েছে');
export const pinPost = A((r) => svc.pinPost(r.user, r.params.id, r.body, r), 'সম্পন্ন হয়েছে');
export const hideComment = A((r) => svc.hideComment(r.user, r.params.id, r.body, r), 'সম্পন্ন হয়েছে');
export const queue = A((r) => svc.moderationQueue(r.query));
export const dismiss = done((r) => svc.dismissReports(r.user, r.params.kind, r.params.id, r), 'রিপোর্ট নিষ্পত্তি হয়েছে');
