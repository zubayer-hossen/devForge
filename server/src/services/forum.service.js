import { DiscussionPost, Comment, PointTransaction } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, parsePagination } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';
import { getSettings } from './settings.service.js';
import { logActivity } from './activity.service.js';
import { awardPoints } from './points.service.js';
import { recordActivityDay } from './streak.service.js';
import { checkAchievements } from './achievement.service.js';
import {
  canDelete, canEdit, dedupeTags, helpfulAwardProblem, isAuthor, isStaff, replyAllowed, startOfDhakaDay,
} from './forumRules.js';

const AUTHOR_FIELDS = 'fullName username avatar role';
const idStr = (v) => String(v?._id ?? v);

/* ---------- আকার দেওয়া (shaping) ---------- */
function shapePost(post, user, staff) {
  const { likes = [], bookmarks = [], reports = [], ...rest } = post;
  return {
    ...rest,
    likeCount: likes.length,
    liked: likes.some((l) => idStr(l) === idStr(user._id)),
    bookmarked: bookmarks.some((b) => idStr(b) === idStr(user._id)),
    reportedByMe: reports.some((r) => idStr(r.user) === idStr(user._id)),
    isOwner: isAuthor(user, post),
    ...(staff ? { reportCount: reports.length } : {}),
  };
}

function shapeComment(c, user, staff) {
  const { likes = [], reports = [], ...rest } = c;
  const masked = c.isHidden && !staff; // লুকানো মন্তব্য সদস্যদের কাছে জায়গা ধরে রাখে (থ্রেড ভাঙে না), কিন্তু লেখা দেখা যায় না
  return {
    ...rest,
    ...(masked ? { body: '', codeSnippet: undefined } : {}),
    likeCount: likes.length,
    liked: likes.some((l) => idStr(l) === idStr(user._id)),
    reportedByMe: reports.some((r) => idStr(r.user) === idStr(user._id)),
    isOwner: isAuthor(user, c),
    ...(staff ? { reportCount: reports.length } : {}),
  };
}

async function loadPost(id, user, { allowHidden = false } = {}) {
  const post = await DiscussionPost.findById(id);
  if (!post || (post.isHidden && !isStaff(user.role) && !allowHidden)) throw AppError.notFound('পোস্ট পাওয়া যায়নি');
  return post;
}

async function loadComment(id) {
  const c = await Comment.findById(id);
  if (!c) throw AppError.notFound('মন্তব্য পাওয়া যায়নি');
  return c;
}

/* ---------- পোস্ট ---------- */
export async function listPosts(user, q) {
  const staff = isStaff(user.role);
  const { page, limit, skip } = parsePagination(q, { defaultLimit: 12, maxLimit: 50 });
  const match = {};
  if (!staff) match.isHidden = false;
  if (q.type) match.type = q.type;
  if (q.tag) match.tags = q.tag;
  if (q.mine) match.author = user._id;
  if (q.bookmarked) match.bookmarks = user._id;
  if (q.unanswered) { match.type = 'QUESTION'; match.isResolved = false; }
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    match.$or = [{ title: rx }, { body: rx }, { tags: rx }];
  }
  const sort = q.sort === 'popular'
    ? { isPinned: -1, likeCount: -1, commentCount: -1, createdAt: -1 }
    : { isPinned: -1, createdAt: -1 };

  const [r] = await DiscussionPost.aggregate([
    { $match: match },
    { $addFields: {
      likeCount: { $size: { $ifNull: ['$likes', []] } },
      liked: { $in: [user._id, { $ifNull: ['$likes', []] }] },
      bookmarked: { $in: [user._id, { $ifNull: ['$bookmarks', []] }] },
      reportCount: { $size: { $ifNull: ['$reports', []] } },
      codeCount: { $size: { $ifNull: ['$codeSnippets', []] } },
      excerpt: { $substrCP: ['$body', 0, 220] },
    } },
    { $sort: sort },
    { $facet: {
      items: [
        { $skip: skip }, { $limit: limit },
        { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
        { $unwind: '$author' },
        // কেবল নিরাপদ ফিল্ড রাখা হয় (ইমেইল/পাসওয়ার্ড-হ্যাশ ইত্যাদি কখনোই বাইরে যায় না)
        { $addFields: { author: { _id: '$author._id', fullName: '$author.fullName', username: '$author.username', avatar: '$author.avatar', role: '$author.role' } } },
        { $project: { likes: 0, bookmarks: 0, reports: 0, body: 0, codeSnippets: 0 } },
      ],
      total: [{ $count: 'n' }],
    } },
  ]);
  const total = r.total[0]?.n || 0;
  return {
    items: r.items.map((p) => (staff ? p : { ...p, reportCount: undefined })),
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}

export async function popularTags() {
  const rows = await DiscussionPost.aggregate([
    { $match: { isHidden: false } }, { $unwind: '$tags' },
    { $group: { _id: '$tags', n: { $sum: 1 } } }, { $sort: { n: -1, _id: 1 } }, { $limit: 20 },
  ]);
  return rows.map((r) => ({ tag: r._id, count: r.n }));
}

export async function getPost(user, id) {
  const staff = isStaff(user.role);
  const post = await DiscussionPost.findById(id).populate('author', AUTHOR_FIELDS).lean();
  if (!post || (post.isHidden && !staff)) throw AppError.notFound('পোস্ট পাওয়া যায়নি');
  const comments = await Comment.find({ post: id }).sort('createdAt').limit(500).populate('author', AUTHOR_FIELDS).lean();
  return {
    post: shapePost(post, user, staff),
    comments: comments.map((c) => shapeComment(c, user, staff)),
    canModerate: staff,
  };
}

export async function createPost(user, data) {
  const post = await DiscussionPost.create({ ...data, tags: dedupeTags(data.tags), author: user._id });
  recordActivityDay(user._id);
  checkAchievements(user._id);
  return getPost(user, post._id);
}

export async function updatePost(user, id, data) {
  const post = await loadPost(id, user);
  if (!canEdit(user, post)) throw AppError.forbidden('শুধু লেখক নিজের পোস্ট সম্পাদনা করতে পারেন');
  if (post.type !== data.type && post.commentCount > 0) throw AppError.badRequest('উত্তর/মন্তব্য থাকলে পোস্টের ধরন বদলানো যায় না');
  post.set({ ...data, tags: dedupeTags(data.tags) });
  await post.save();
  return getPost(user, id);
}

export async function deletePost(user, id, req) {
  const post = await loadPost(id, user, { allowHidden: true });
  if (!canDelete(user, post)) throw AppError.forbidden('এই পোস্ট মোছার অনুমতি আপনার নেই');
  await Comment.deleteMany({ post: id });
  await DiscussionPost.deleteOne({ _id: id });
  if (!isAuthor(user, post)) {
    await logActivity({ actor: user._id, action: 'FORUM_POST_DELETED', targetType: 'DiscussionPost', metadata: { title: post.title }, req, isAudit: true });
  }
}

/* ---------- লাইক / বুকমার্ক / রিপোর্ট ---------- */
async function toggleSet(Model, id, field, userId) {
  const added = await Model.findOneAndUpdate({ _id: id, [field]: { $ne: userId } }, { $addToSet: { [field]: userId } }, { new: true }).select(field);
  if (added) return { on: true, count: added[field].length };
  const removed = await Model.findOneAndUpdate({ _id: id, [field]: userId }, { $pull: { [field]: userId } }, { new: true }).select(field);
  if (!removed) throw AppError.notFound('পাওয়া যায়নি');
  return { on: false, count: removed[field].length };
}

export async function likePost(user, id) {
  const post = await loadPost(id, user);
  if (isAuthor(user, post)) throw AppError.badRequest('নিজের পোস্টে লাইক দেওয়া যায় না');
  const r = await toggleSet(DiscussionPost, id, 'likes', user._id);
  return { liked: r.on, likeCount: r.count };
}

export async function likeComment(user, id) {
  const c = await loadComment(id);
  await loadPost(c.post, user);
  if (isAuthor(user, c)) throw AppError.badRequest('নিজের মন্তব্যে লাইক দেওয়া যায় না');
  const r = await toggleSet(Comment, id, 'likes', user._id);
  return { liked: r.on, likeCount: r.count };
}

export async function bookmarkPost(user, id) {
  await loadPost(id, user);
  const r = await toggleSet(DiscussionPost, id, 'bookmarks', user._id);
  return { bookmarked: r.on };
}

async function report(Model, doc, user, reason) {
  if (isAuthor(user, doc)) throw AppError.badRequest('নিজের কনটেন্ট রিপোর্ট করা যায় না');
  const r = await Model.updateOne(
    { _id: doc._id, 'reports.user': { $ne: user._id } },
    { $push: { reports: { user: user._id, reason, at: new Date() } } }
  );
  if (!r.modifiedCount) throw AppError.conflict('আপনি আগেই এটি রিপোর্ট করেছেন');
}

export async function reportPost(user, id, { reason }) {
  const post = await loadPost(id, user);
  await report(DiscussionPost, post, user, reason);
}
export async function reportComment(user, id, { reason }) {
  const c = await loadComment(id);
  await loadPost(c.post, user);
  await report(Comment, c, user, reason);
}

/* ---------- মন্তব্য / উত্তর ---------- */
async function notifyComment({ post, comment, parent, user }) {
  const settings = await getSettings();
  if (!settings.notifications.inApp) return;
  const isAnswer = post.type === 'QUESTION' && !parent;
  const targets = new Map();
  if (!isAuthor(user, post)) targets.set(idStr(post.author), isAnswer ? `নতুন উত্তর: ${post.title}` : `নতুন মন্তব্য: ${post.title}`);
  if (parent && !isAuthor(user, parent) && !targets.has(idStr(parent.author))) targets.set(idStr(parent.author), `আপনার মন্তব্যে নতুন উত্তর: ${post.title}`);
  for (const [uid, title] of targets) {
    await createNotification({
      user: uid, type: 'COMMENT', title, message: `${user.fullName}: ${comment.body.slice(0, 120)}`,
      link: `/dashboard/forum/${post._id}`, dedupeKey: `comment:${comment._id}`,
    });
  }
}

export async function createComment(user, postId, data) {
  const post = await loadPost(postId, user);
  let parent = null;
  if (data.parentId) {
    parent = await Comment.findOne({ _id: data.parentId, post: postId });
    if (!parent) throw AppError.notFound('যে মন্তব্যের উত্তর দিতে চান সেটি পাওয়া যায়নি');
    if (!replyAllowed(parent)) throw AppError.badRequest('উত্তরের উত্তর দেওয়া যায় না; মূল মন্তব্যে উত্তর দিন');
  }
  const comment = await Comment.create({
    post: post._id, author: user._id, parent: parent?._id || null, body: data.body, codeSnippet: data.codeSnippet,
  });
  await DiscussionPost.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });
  await notifyComment({ post, comment, parent, user });
  recordActivityDay(user._id);
  return getPost(user, postId);
}

export async function updateComment(user, id, data) {
  const c = await loadComment(id);
  await loadPost(c.post, user);
  if (!canEdit(user, c)) throw AppError.forbidden('শুধু লেখক নিজের মন্তব্য সম্পাদনা করতে পারেন');
  c.body = data.body;
  if (data.codeSnippet !== undefined) c.codeSnippet = data.codeSnippet || undefined;
  await c.save();
  return getPost(user, c.post);
}

export async function deleteComment(user, id, req) {
  const c = await loadComment(id);
  const post = await loadPost(c.post, user, { allowHidden: true });
  if (!canDelete(user, c)) throw AppError.forbidden('এই মন্তব্য মোছার অনুমতি আপনার নেই');
  const ids = [c._id, ...(await Comment.find({ parent: c._id }).select('_id').lean()).map((x) => x._id)];
  const r = await Comment.deleteMany({ _id: { $in: ids } });
  const update = { $inc: { commentCount: -r.deletedCount } };
  if (post.acceptedAnswer && ids.some((x) => idStr(x) === idStr(post.acceptedAnswer))) {
    update.$set = { isResolved: false };
    update.$unset = { acceptedAnswer: 1 };
  }
  await DiscussionPost.updateOne({ _id: post._id }, update);
  if (!isAuthor(user, c)) {
    await logActivity({ actor: user._id, action: 'FORUM_COMMENT_DELETED', targetType: 'Comment', metadata: { post: post.title }, req, isAudit: true });
  }
  return getPost(user, post._id).catch(() => null);
}

/* ---------- উত্তর গ্রহণ ---------- */
export async function acceptAnswer(user, postId, { commentId }) {
  const post = await loadPost(postId, user);
  if (post.type !== 'QUESTION') throw AppError.badRequest('শুধু প্রশ্নের উত্তর গ্রহণ করা যায়');
  if (!isAuthor(user, post)) throw AppError.forbidden('শুধু প্রশ্নকারী উত্তর গ্রহণ করতে পারেন');
  const answer = await Comment.findOne({ _id: commentId, post: postId, parent: null });
  if (!answer) throw AppError.notFound('উত্তরটি পাওয়া যায়নি');
  if (answer.isHidden) throw AppError.badRequest('লুকানো উত্তর গ্রহণ করা যায় না');

  if (post.acceptedAnswer && idStr(post.acceptedAnswer) !== idStr(answer._id)) {
    await Comment.updateOne({ _id: post.acceptedAnswer }, { $set: { isAnswer: false } });
  }
  await Comment.updateOne({ _id: answer._id }, { $set: { isAnswer: true } });
  await DiscussionPost.updateOne({ _id: postId }, { $set: { acceptedAnswer: answer._id, isResolved: true } });

  // সহায়ক-উত্তর পয়েন্ট: sourceKey অনন্য, তাই একই উত্তরে বারবার গ্রহণ/বাতিল করে পয়েন্ট বাড়ানো যায় না
  const settings = await getSettings();
  const amount = settings.pointRules.helpfulAnswer;
  const awardedToday = await PointTransaction.countDocuments({
    user: answer.author, reason: 'HELPFUL_CONTRIBUTION', createdAt: { $gte: startOfDhakaDay() },
  });
  const problem = helpfulAwardProblem({ accepterId: user._id, answererId: answer.author, awardedToday, amount });
  let awarded = 0;
  if (!problem) {
    awarded = (await awardPoints({
      userId: answer.author, amount, reason: 'HELPFUL_CONTRIBUTION',
      sourceKey: `helpful:${answer._id}`, note: post.title, awardedBy: user._id,
    })) || 0;
  }
  if (awarded) checkAchievements(answer.author);
  if (!isAuthor(user, answer) && settings.notifications.inApp) {
    await createNotification({
      user: answer.author, type: 'COMMENT', title: `আপনার উত্তর গৃহীত হয়েছে${awarded ? ` (+${awarded} পয়েন্ট)` : ''}`,
      message: post.title, link: `/dashboard/forum/${postId}`, dedupeKey: `accepted:${answer._id}`,
    });
  }
  return { ...(await getPost(user, postId)), pointsAwarded: awarded };
}

export async function unacceptAnswer(user, postId) {
  const post = await loadPost(postId, user);
  if (!isAuthor(user, post)) throw AppError.forbidden('শুধু প্রশ্নকারী এটি করতে পারেন');
  if (post.acceptedAnswer) await Comment.updateOne({ _id: post.acceptedAnswer }, { $set: { isAnswer: false } });
  await DiscussionPost.updateOne({ _id: postId }, { $set: { isResolved: false }, $unset: { acceptedAnswer: 1 } });
  return getPost(user, postId);
}

/* ---------- মডারেশন (স্টাফ) ---------- */
export async function hidePost(user, id, { hidden }, req) {
  const post = await loadPost(id, user, { allowHidden: true });
  await DiscussionPost.updateOne({ _id: id }, { $set: { isHidden: hidden } });
  await logActivity({ actor: user._id, action: hidden ? 'FORUM_POST_HIDDEN' : 'FORUM_POST_UNHIDDEN', targetType: 'DiscussionPost', targetId: id, metadata: { title: post.title }, req, isAudit: true });
  return getPost(user, id);
}

export async function pinPost(user, id, { pinned }, req) {
  const post = await loadPost(id, user);
  await DiscussionPost.updateOne({ _id: id }, { $set: { isPinned: pinned } });
  await logActivity({ actor: user._id, action: pinned ? 'FORUM_POST_PINNED' : 'FORUM_POST_UNPINNED', targetType: 'DiscussionPost', targetId: id, metadata: { title: post.title }, req, isAudit: true });
  return getPost(user, id);
}

export async function hideComment(user, id, { hidden }, req) {
  const c = await loadComment(id);
  await Comment.updateOne({ _id: id }, { $set: { isHidden: hidden } });
  await logActivity({ actor: user._id, action: hidden ? 'FORUM_COMMENT_HIDDEN' : 'FORUM_COMMENT_UNHIDDEN', targetType: 'Comment', targetId: id, req, isAudit: true });
  return getPost(user, c.post);
}

export async function moderationQueue({ kind }) {
  const filter = { $or: [{ 'reports.0': { $exists: true } }, { isHidden: true }] };
  if (kind === 'posts') {
    const items = await DiscussionPost.find(filter).sort('-updatedAt').limit(100)
      .select('title type isHidden isPinned reports createdAt').populate('author', AUTHOR_FIELDS).populate('reports.user', 'fullName username').lean();
    return items.sort((a, b) => b.reports.length - a.reports.length);
  }
  const items = await Comment.find(filter).sort('-updatedAt').limit(100)
    .select('body codeSnippet isHidden reports post createdAt').populate('author', AUTHOR_FIELDS)
    .populate('post', 'title').populate('reports.user', 'fullName username').lean();
  return items.sort((a, b) => b.reports.length - a.reports.length);
}

export async function dismissReports(user, kind, id, req) {
  const Model = kind === 'posts' ? DiscussionPost : Comment;
  const r = await Model.updateOne({ _id: id }, { $set: { reports: [] } });
  if (!r.matchedCount) throw AppError.notFound('পাওয়া যায়নি');
  await logActivity({ actor: user._id, action: 'FORUM_REPORTS_DISMISSED', targetType: kind === 'posts' ? 'DiscussionPost' : 'Comment', targetId: id, req, isAudit: true });
}
