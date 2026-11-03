import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HELPFUL_DAILY_CAP, canDelete, canEdit, dedupeTags, helpfulAwardProblem, isStaff, replyAllowed, startOfDhakaDay,
} from '../src/services/forumRules.js';

const member = { _id: 'u1', role: 'MEMBER' };
const other = { _id: 'u2', role: 'MEMBER' };
const mod = { _id: 'u3', role: 'MODERATOR' };
const post = { author: 'u1' };

test('স্টাফ রোল', () => {
  assert.equal(isStaff('MODERATOR'), true);
  assert.equal(isStaff('ADMIN'), true);
  assert.equal(isStaff('SUPER_ADMIN'), true);
  assert.equal(isStaff('MEMBER'), false);
});

test('মোছার অনুমতি: লেখক বা স্টাফ; সম্পাদনা: শুধু লেখক', () => {
  assert.equal(canDelete(member, post), true);
  assert.equal(canDelete(other, post), false);
  assert.equal(canDelete(mod, post), true);
  assert.equal(canEdit(member, post), true);
  assert.equal(canEdit(mod, post), false, 'মডারেটর অন্যের লেখা বদলাতে পারে না');
  assert.equal(canEdit(other, post), false);
});

test('populate করা author অবজেক্টেও কাজ করে', () => {
  assert.equal(canEdit(member, { author: { _id: 'u1' } }), true);
  assert.equal(canEdit(other, { author: { _id: 'u1' } }), false);
});

test('reply শুধু এক স্তর', () => {
  assert.equal(replyAllowed({ parent: null }), true);
  assert.equal(replyAllowed({}), true);
  assert.equal(replyAllowed({ parent: 'c1' }), false);
  assert.equal(replyAllowed(null), false);
});

test('ট্যাগ: ছোট হাতের, অনন্য, সর্বোচ্চ ৫', () => {
  assert.deepEqual(dedupeTags([' React ', 'react', 'JS', '', 'a', 'b', 'c', 'd']), ['react', 'js', 'a', 'b', 'c']);
});

test('সহায়ক-উত্তর পয়েন্ট: জালিয়াতি-প্রতিরোধ', () => {
  const ok = { accepterId: 'u1', answererId: 'u2', awardedToday: 0, amount: 10 };
  assert.equal(helpfulAwardProblem(ok), null);
  assert.ok(helpfulAwardProblem({ ...ok, answererId: 'u1' }), 'নিজের উত্তরে নয়');
  assert.ok(helpfulAwardProblem({ ...ok, awardedToday: HELPFUL_DAILY_CAP }), 'দৈনিক সীমা');
  assert.equal(helpfulAwardProblem({ ...ok, awardedToday: HELPFUL_DAILY_CAP - 1 }), null);
  assert.ok(helpfulAwardProblem({ ...ok, amount: 0 }), 'পয়েন্ট বন্ধ থাকলে');
  assert.ok(helpfulAwardProblem({ ...ok, amount: -5 }));
  assert.ok(helpfulAwardProblem({ ...ok, amount: 2.5 }));
});

test('বাংলাদেশ সময়ে দিন শুরু (UTC+6)', () => {
  // ২০২৬-১১-১০ ১৯:০০ UTC = ২০২৬-১১-১১ ০১:০০ ঢাকা → দিন শুরু ১১ তারিখ ০০:০০+06 = ১০ তারিখ ১৮:০০ UTC
  assert.equal(startOfDhakaDay(new Date('2026-11-10T19:00:00Z')).toISOString(), '2026-11-10T18:00:00.000Z');
  // ২০২৬-১১-১০ ০৩:০০ UTC = ঢাকায় ০৯:০০ (১০ তারিখ) → দিন শুরু ৯ তারিখ ১৮:০০ UTC
  assert.equal(startOfDhakaDay(new Date('2026-11-10T03:00:00Z')).toISOString(), '2026-11-09T18:00:00.000Z');
});
