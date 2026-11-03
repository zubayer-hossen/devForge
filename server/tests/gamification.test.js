import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, dhakaDay, effectiveCurrent, nextStreak } from '../src/services/streakRules.js';
import { periodStart, rankEntries } from '../src/services/leaderboardRules.js';
import { CATALOG, earnedKeys } from '../src/services/achievementCatalog.js';

test('addDays মাস ও বছরের সীমা পেরোয়', () => {
  assert.equal(addDays('2026-11-10', 1), '2026-11-11');
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('dhakaDay: UTC রাত ১৮:০০-এর পর ঢাকায় পরের দিন', () => {
  assert.equal(dhakaDay(new Date('2026-11-10T17:59:00Z')), '2026-11-10');
  assert.equal(dhakaDay(new Date('2026-11-10T18:00:00Z')), '2026-11-11');
});

test('স্ট্রিক: প্রথম কাজ, পরপর দিন, ফাঁক, একই দিন', () => {
  assert.deepEqual(nextStreak({}, '2026-11-10'), { changed: true, current: 1, longest: 1, lastActiveDate: '2026-11-10' });
  assert.equal(nextStreak({ lastActiveDate: '2026-11-09', current: 4, longest: 4 }, '2026-11-10').current, 5);
  assert.equal(nextStreak({ lastActiveDate: '2026-11-09', current: 4, longest: 9 }, '2026-11-10').longest, 9);
  const gap = nextStreak({ lastActiveDate: '2026-11-07', current: 6, longest: 6 }, '2026-11-10');
  assert.equal(gap.current, 1);
  assert.equal(gap.longest, 6, 'সর্বোচ্চ স্ট্রিক হারায় না');
  const same = nextStreak({ lastActiveDate: '2026-11-10', current: 3, longest: 3 }, '2026-11-10');
  assert.equal(same.changed, false);
  assert.equal(same.current, 3);
});

test('দেখানোর স্ট্রিক: গতকাল/আজ হলে বজায়, নইলে ০', () => {
  assert.equal(effectiveCurrent({ lastActiveDate: '2026-11-10', current: 3 }, '2026-11-10'), 3);
  assert.equal(effectiveCurrent({ lastActiveDate: '2026-11-09', current: 3 }, '2026-11-10'), 3);
  assert.equal(effectiveCurrent({ lastActiveDate: '2026-11-08', current: 3 }, '2026-11-10'), 0);
  assert.equal(effectiveCurrent({}, '2026-11-10'), 0);
});

test('সপ্তাহ শুরু শনিবার (ঢাকা সময়)', () => {
  // ২০২৬-১১-১০ মঙ্গলবার → সপ্তাহ শুরু শনিবার ২০২৬-১১-০৭ ০০:০০+০৬ = ০৬ তারিখ ১৮:০০ UTC
  assert.equal(periodStart('weekly', new Date('2026-11-10T06:00:00Z')).toISOString(), '2026-11-06T18:00:00.000Z');
  // শনিবার নিজেই সপ্তাহের শুরু
  assert.equal(periodStart('weekly', new Date('2026-11-07T06:00:00Z')).toISOString(), '2026-11-06T18:00:00.000Z');
  // শুক্রবার → আগের শনিবার
  assert.equal(periodStart('weekly', new Date('2026-11-13T06:00:00Z')).toISOString(), '2026-11-06T18:00:00.000Z');
  // রবিবার → আগের শনিবার
  assert.equal(periodStart('weekly', new Date('2026-11-08T06:00:00Z')).toISOString(), '2026-11-06T18:00:00.000Z');
});

test('মাস শুরু ঢাকা সময়ে ১ তারিখ; all হলে null', () => {
  assert.equal(periodStart('monthly', new Date('2026-11-10T06:00:00Z')).toISOString(), '2026-10-31T18:00:00.000Z');
  assert.equal(periodStart('all'), null);
});

test('র‍্যাঙ্কিং: সমান পয়েন্টে সমান র‍্যাঙ্ক, পরের র‍্যাঙ্ক লাফায়', () => {
  const e = (name, points) => ({ user: { fullName: name }, points });
  const r = rankEntries([e('গ', 50), e('ক', 90), e('খ', 90), e('ঘ', 10)]);
  assert.deepEqual(r.map((x) => [x.user.fullName, x.rank]), [['ক', 1], ['খ', 1], ['গ', 3], ['ঘ', 4]]);
  assert.deepEqual(rankEntries([]), []);
});

test('ব্যাজ: শর্ত পূরণে অর্জিত, নইলে নয়; কী অনন্য', () => {
  const base = { forumPosts: 0, submissions: 0, approved: 0, completedTasks: 0, longestStreak: 0, helpful: 0, points: 0 };
  assert.deepEqual(earnedKeys(base), []);
  const keys = earnedKeys({ ...base, submissions: 2, approved: 1, longestStreak: 7, points: 120 });
  for (const k of ['FIRST_SUBMISSION', 'FIRST_APPROVED', 'STREAK_3', 'STREAK_7', 'POINTS_100']) assert.ok(keys.includes(k), k);
  assert.ok(!keys.includes('STREAK_30') && !keys.includes('POINTS_500'));
  assert.equal(new Set(CATALOG.map((a) => a.key)).size, CATALOG.length);
});
