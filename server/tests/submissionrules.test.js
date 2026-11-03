import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLOCKS_NEW, assignmentStatusAfterReview, isEditable, isReviewable, maxPointsFor, reviewProblem,
} from '../src/services/submissionRules.js';

test('সম্পাদনা ও রিভিউযোগ্য অবস্থা', () => {
  assert.equal(isEditable('SUBMITTED'), true);
  assert.equal(isEditable('REVISION_REQUESTED'), true);
  assert.equal(isEditable('APPROVED'), false);
  assert.equal(isEditable('REJECTED'), false);
  assert.equal(isEditable('UNDER_REVIEW'), false);
  assert.equal(isReviewable('SUBMITTED'), true);
  assert.equal(isReviewable('UNDER_REVIEW'), true);
  assert.equal(isReviewable('APPROVED'), false);
  assert.equal(isReviewable('REVISION_REQUESTED'), false);
});

test('নতুন সাবমিশন ঠেকায়: REJECTED ছাড়া সব চালু/অনুমোদিত অবস্থা', () => {
  for (const s of ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REVISION_REQUESTED']) assert.ok(BLOCKS_NEW.includes(s));
  assert.ok(!BLOCKS_NEW.includes('REJECTED'));
});

test('সর্বোচ্চ পয়েন্ট: টাস্কের পয়েন্ট, নতুবা ১০০', () => {
  assert.equal(maxPointsFor({ points: 40 }), 40);
  assert.equal(maxPointsFor(null), 100);
});

test('রিভিউ যাচাই: পয়েন্ট জালিয়াতি ঠেকানো', () => {
  const ok = { decision: 'APPROVED', points: 10, feedback: '', maxPoints: 40 };
  assert.equal(reviewProblem(ok), null);
  assert.ok(reviewProblem({ ...ok, points: 41 }), 'সর্বোচ্চের বেশি পয়েন্ট');
  assert.ok(reviewProblem({ ...ok, points: -5 }), 'ঋণাত্মক পয়েন্ট');
  assert.ok(reviewProblem({ ...ok, points: 2.5 }), 'ভগ্নাংশ পয়েন্ট');
  assert.ok(reviewProblem({ ...ok, decision: 'REJECTED', feedback: 'ঠিক হয়নি', points: 5 }), 'প্রত্যাখ্যানে পয়েন্ট');
  assert.ok(reviewProblem({ ...ok, decision: 'REVISION_REQUESTED', feedback: 'সংশোধন', points: 1 }), 'রিভিশনে পয়েন্ট');
  assert.equal(reviewProblem({ ...ok, points: 0 }), null);
  assert.equal(reviewProblem({ ...ok, points: 40 }), null);
});

test('প্রত্যাখ্যান/রিভিশনে কারণ বাধ্যতামূলক', () => {
  assert.ok(reviewProblem({ decision: 'REJECTED', points: 0, feedback: '', maxPoints: 10 }));
  assert.ok(reviewProblem({ decision: 'REVISION_REQUESTED', points: 0, feedback: 'ছোট', maxPoints: 10 }));
  assert.equal(reviewProblem({ decision: 'REVISION_REQUESTED', points: 0, feedback: 'লেআউট ঠিক করুন', maxPoints: 10 }), null);
  assert.ok(reviewProblem({ decision: 'NOPE', points: 0, feedback: 'xxxxx', maxPoints: 10 }));
});

test('রিভিউয়ের পর অ্যাসাইনমেন্টের অবস্থা', () => {
  assert.equal(assignmentStatusAfterReview('APPROVED'), 'COMPLETED');
  assert.equal(assignmentStatusAfterReview('REJECTED'), 'IN_PROGRESS');
  assert.equal(assignmentStatusAfterReview('REVISION_REQUESTED'), 'IN_PROGRESS');
});
