import path from 'node:path';
import { Submission, SubmissionReview, Task, TaskAssignment, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, paginate, parsePagination } from '../utils/pagination.js';
import { randomToken } from '../utils/crypto.js';
import { enqueueEmail } from './email/email.service.js';
import { createNotification, notifyAdmins } from './notification.service.js';
import { getSettings } from './settings.service.js';
import { logActivity } from './activity.service.js';
import { uploadBuffer, deleteAsset } from './upload.service.js';
import { awardPoints } from './points.service.js';
import { recordActivityDay } from './streak.service.js';
import { checkAchievements } from './achievement.service.js';
import { canSubmitNow } from './taskRules.js';
import {
  BLOCKS_NEW, MAX_FILES, MAX_SCREENSHOTS, assignmentStatusAfterReview, isEditable, isReviewable, maxPointsFor, reviewProblem,
} from './submissionRules.js';

const LINKS = ['githubUrl', 'liveUrl', 'driveUrl'];
const DECISION_LABEL = { APPROVED: 'অনুমোদিত', REJECTED: 'প্রত্যাখ্যাত', REVISION_REQUESTED: 'রিভিশন প্রয়োজন' };

async function afterSubmit(user, sub, version) {
  recordActivityDay(user._id); // স্ট্রিক (ব্যর্থ হলেও মূল কাজ আটকায় না)
  await enqueueEmail({
    to: user.email, type: 'SUBMISSION_RECEIVED', data: { name: user.fullName, title: sub.title },
    dedupeKey: `sub-received:${sub._id}:${version}`,
  });
  await notifyAdmins({
    type: 'SUBMISSION_UPDATE', title: `নতুন সাবমিশন: ${sub.title}`,
    message: `${user.fullName} ${version > 1 ? 'সংশোধন করে আবার জমা দিয়েছেন' : 'জমা দিয়েছেন'}`, link: `/admin/submissions/${sub._id}`,
  });
}

const taskPopulate = { path: 'task', select: 'title points deadline status allowLateSubmission' };

async function loadOwn(user, id) {
  const sub = await Submission.findOne({ _id: id, user: user._id });
  if (!sub) throw AppError.notFound('সাবমিশন পাওয়া যায়নি');
  return sub;
}

/* ---------- সদস্য ---------- */
export async function createSubmission(user, data, req) {
  const { taskId, ...fields } = data;
  let task = null;
  let isLate = false;

  if (taskId) {
    const [t, assignment] = await Promise.all([Task.findById(taskId), TaskAssignment.findOne({ task: taskId, user: user._id })]);
    if (!t || !assignment || t.status === 'DRAFT') throw AppError.notFound('টাস্কটি আপনার জন্য নয়');
    if (!canSubmitNow(t)) throw AppError.badRequest('এই টাস্কে এখন জমা দেওয়া যাবে না (ডেডলাইন পেরিয়েছে বা টাস্ক বন্ধ)');
    if (await Submission.exists({ task: taskId, user: user._id, status: { $in: BLOCKS_NEW } })) {
      throw AppError.conflict('এই টাস্কে আপনার সাবমিশন আগে থেকেই আছে। আগেরটি দেখুন বা সংশোধন করুন।');
    }
    task = t;
    isLate = Boolean(t.deadline && Date.now() > new Date(t.deadline).getTime());
  }

  const clean = { ...fields };
  LINKS.forEach((k) => { if (clean[k] === '') delete clean[k]; }); // ফাঁকা লিংক সংরক্ষণ হয় না
  const sub = await Submission.create({
    ...clean, user: user._id, task: task?._id, isLate, status: 'SUBMITTED', version: 1,
    history: [{ status: 'SUBMITTED', by: user._id }],
  });
  if (task) await TaskAssignment.updateOne({ task: task._id, user: user._id }, { $set: { status: 'SUBMITTED' } });
  await afterSubmit(user, sub, 1);
  await logActivity({ actor: user._id, action: 'SUBMISSION_CREATED', targetType: 'Submission', targetId: sub._id, metadata: { title: sub.title }, req });
  return getMine(user, sub._id);
}

export async function updateSubmission(user, id, data, req) {
  const sub = await loadOwn(user, id);
  if (!isEditable(sub.status)) throw AppError.badRequest('এই সাবমিশন এখন সম্পাদনা করা যাবে না');
  const resubmit = sub.status === 'REVISION_REQUESTED';

  if (resubmit && sub.task) {
    const task = await Task.findById(sub.task).select('status');
    if (!task || task.status !== 'PUBLISHED') throw AppError.badRequest('টাস্কটি বন্ধ বা অপ্রকাশিত, তাই আবার জমা দেওয়া যাবে না');
  }

  const clean = { ...data };
  LINKS.forEach((k) => { if (clean[k] === '') clean[k] = undefined; }); // ফাঁকা লিংক = মুছে ফেলা
  sub.set(clean);
  if (resubmit) {
    sub.version += 1;
    sub.status = 'SUBMITTED';
    sub.history.push({ status: 'SUBMITTED', by: user._id, at: new Date() });
  }
  await sub.save();

  if (resubmit) {
    if (sub.task) await TaskAssignment.updateOne({ task: sub.task, user: user._id }, { $set: { status: 'SUBMITTED' } });
    await afterSubmit(user, sub, sub.version);
  }
  await logActivity({ actor: user._id, action: resubmit ? 'SUBMISSION_RESUBMITTED' : 'SUBMISSION_UPDATED', targetType: 'Submission', targetId: sub._id, req });
  return getMine(user, id);
}

export async function addMedia(user, id, kind, file, req) {
  const sub = await loadOwn(user, id);
  if (!isEditable(sub.status)) throw AppError.badRequest('এই সাবমিশনে এখন ফাইল যোগ করা যাবে না');
  const limit = kind === 'screenshots' ? MAX_SCREENSHOTS : MAX_FILES;
  if (sub[kind].length >= limit) throw AppError.badRequest(`সর্বোচ্চ ${limit}টি ${kind === 'screenshots' ? 'স্ক্রিনশট' : 'ফাইল'} যোগ করা যায়`);

  const image = file.mimetype.startsWith('image/');
  const ext = path.extname(file.originalname).toLowerCase();
  const uploaded = await uploadBuffer(file.buffer, {
    folder: `devforge/submissions/${sub._id}`, publicId: `${randomToken(8)}${image ? '' : ext}`, image,
  });
  sub[kind].push({
    name: file.originalname.replace(/[\u0000-\u001f]/g, '').slice(0, 120),
    url: uploaded.url, publicId: uploaded.publicId, size: file.size, mimeType: file.mimetype,
  });
  await sub.save();
  await logActivity({ actor: user._id, action: 'SUBMISSION_MEDIA_ADDED', targetType: 'Submission', targetId: sub._id, req });
  return getMine(user, id);
}

export async function removeMedia(user, id, kind, publicId, req) {
  const sub = await loadOwn(user, id);
  if (!isEditable(sub.status)) throw AppError.badRequest('এই সাবমিশন থেকে এখন ফাইল সরানো যাবে না');
  const item = sub[kind].find((f) => f.publicId === publicId);
  if (!item) throw AppError.notFound('ফাইলটি পাওয়া যায়নি');
  await deleteAsset(item.publicId, item.mimeType?.startsWith('image/'));
  sub[kind] = sub[kind].filter((f) => f.publicId !== publicId);
  await sub.save();
  await logActivity({ actor: user._id, action: 'SUBMISSION_MEDIA_REMOVED', targetType: 'Submission', targetId: sub._id, req });
  return getMine(user, id);
}

export async function listMine(user, q) {
  const filter = { user: user._id };
  if (q.status) filter.status = q.status;
  return paginate(Submission, filter, parsePagination(q, { defaultLimit: 12 }), {
    sort: '-createdAt', populate: { path: 'task', select: 'title' },
    select: 'title status version isLate pointsAwarded createdAt updatedAt task technologies',
  });
}

async function withReviews(sub) {
  const reviews = await SubmissionReview.find({ submission: sub._id }).sort('createdAt').populate('reviewer', 'fullName').lean();
  return reviews;
}

export async function getMine(user, id) {
  const sub = await Submission.findOne({ _id: id, user: user._id }).populate(taskPopulate).lean();
  if (!sub) throw AppError.notFound('সাবমিশন পাওয়া যায়নি');
  return { submission: sub, reviews: await withReviews(sub), editable: isEditable(sub.status) };
}

/* ---------- অ্যাডমিন ---------- */
export async function listAdmin(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.taskId) filter.task = q.taskId;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    const users = await User.find({ $or: [{ fullName: rx }, { username: rx }] }).select('_id').limit(300).lean();
    filter.$or = [{ title: rx }, { user: { $in: users.map((u) => u._id) } }];
  }
  const waiting = q.status === 'SUBMITTED' || q.status === 'UNDER_REVIEW';
  return paginate(Submission, filter, parsePagination(q, { defaultLimit: 12 }), {
    sort: waiting ? 'createdAt' : '-updatedAt',
    populate: [{ path: 'user', select: 'fullName username avatar' }, { path: 'task', select: 'title' }],
    select: 'title status version isLate pointsAwarded createdAt updatedAt task user',
  });
}

export async function getAdmin(id) {
  const sub = await Submission.findById(id)
    .populate('user', 'fullName username email avatar').populate(taskPopulate)
    .populate('history.by', 'fullName').lean();
  if (!sub) throw AppError.notFound('সাবমিশন পাওয়া যায়নি');
  return { submission: sub, reviews: await withReviews(sub), canReview: isReviewable(sub.status), maxPoints: maxPointsFor(sub.task) };
}

export async function startReview(id, actor, req) {
  const sub = await Submission.findOneAndUpdate(
    { _id: id, status: 'SUBMITTED' },
    { $set: { status: 'UNDER_REVIEW' }, $push: { history: { status: 'UNDER_REVIEW', by: actor._id, at: new Date() } } },
    { new: true }
  );
  if (!sub && !(await Submission.exists({ _id: id, status: 'UNDER_REVIEW' }))) throw AppError.conflict('সাবমিশনটির রিভিউ শুরু করা যাবে না');
  await logActivity({ actor: actor._id, action: 'SUBMISSION_REVIEW_STARTED', targetType: 'Submission', targetId: id, req, isAudit: true });
  return getAdmin(id);
}

export async function reviewSubmission(id, data, actor, req) {
  const current = await Submission.findById(id).populate('task', 'title points');
  if (!current) throw AppError.notFound('সাবমিশন পাওয়া যায়নি');
  if (String(current.user) === String(actor._id)) throw AppError.forbidden('নিজের সাবমিশন নিজে রিভিউ করা যাবে না');

  const problem = reviewProblem({ ...data, maxPoints: maxPointsFor(current.task) });
  if (problem) throw AppError.badRequest(problem);

  // অ্যাটমিক দখল: একই সাবমিশন দুজন অ্যাডমিন একসঙ্গে রিভিউ করতে পারবে না
  const claimed = await Submission.findOneAndUpdate(
    { _id: id, status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } },
    { $set: { status: data.decision }, $push: { history: { status: data.decision, by: actor._id, at: new Date() } } },
    { new: true }
  );
  if (!claimed) throw AppError.conflict('সাবমিশনটি ইতিমধ্যে রিভিউ হয়ে গেছে');

  const points = data.decision === 'APPROVED' ? data.points : 0;
  await SubmissionReview.create({
    submission: id, reviewer: actor._id, decision: data.decision, feedback: data.feedback, points, submissionVersion: claimed.version,
  });

  let awarded = 0;
  if (points > 0) {
    awarded = (await awardPoints({
      userId: claimed.user, amount: points, reason: 'TASK_COMPLETION',
      sourceKey: `submission:${id}:v${claimed.version}`, note: current.title, awardedBy: actor._id,
    })) || 0;
    await Submission.updateOne({ _id: id }, { $set: { pointsAwarded: awarded } });
  }

  if (claimed.task) {
    const status = assignmentStatusAfterReview(data.decision);
    await TaskAssignment.updateOne({ task: claimed.task, user: claimed.user }, {
      $set: { status, ...(status === 'COMPLETED' ? { completedAt: new Date(), pointsAwarded: awarded } : {}) },
    });
  }

  checkAchievements(claimed.user);
  const member = await User.findById(claimed.user).select('email fullName');
  const settings = await getSettings();
  if (member) {
    if (settings.notifications.inApp) {
      await createNotification({
        user: member._id, type: 'REVIEW_FEEDBACK', title: `সাবমিশন ${DECISION_LABEL[data.decision]}: ${current.title}`,
        message: data.feedback.slice(0, 200), link: `/dashboard/submissions/${id}`,
      });
    }
    if (settings.notifications.emailOnReview) {
      const dedupeKey = `sub-review:${id}:v${claimed.version}`;
      if (data.decision === 'REVISION_REQUESTED') {
        await enqueueEmail({ to: member.email, type: 'REVISION_REQUEST', data: { name: member.fullName, title: current.title, feedback: data.feedback }, dedupeKey });
      } else {
        await enqueueEmail({ to: member.email, type: 'SUBMISSION_REVIEW', data: { name: member.fullName, title: current.title, decision: DECISION_LABEL[data.decision], feedback: data.feedback, points: awarded }, dedupeKey });
      }
    }
  }
  await logActivity({
    actor: actor._id, action: `SUBMISSION_${data.decision}`, targetType: 'Submission', targetId: id,
    metadata: { title: current.title, points: awarded }, req, isAudit: true,
  });
  return getAdmin(id);
}
