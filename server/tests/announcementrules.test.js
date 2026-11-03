import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, scheduleProblem, visibleToUser } from '../src/services/announcementRules.js';

const NOW = new Date('2026-11-10T12:00:00Z');

test('দৃশ্যমানতা: শুধু প্রকাশিত; গ্রুপ-সীমাবদ্ধ হলে শুধু ওই গ্রুপের সদস্য; অ্যাডমিন সব দেখে', () => {
  const open = { status: 'PUBLISHED', audienceGroups: [] };
  const grp = { status: 'PUBLISHED', audienceGroups: ['g1', 'g2'] };
  assert.equal(visibleToUser(open, []), true);
  assert.equal(visibleToUser(grp, []), false);
  assert.equal(visibleToUser(grp, ['g2']), true);
  assert.equal(visibleToUser(grp, ['g9']), false);
  assert.equal(visibleToUser(grp, [], true), true);
  assert.equal(visibleToUser({ status: 'DRAFT', audienceGroups: [] }, [], true), false);
  assert.equal(visibleToUser({ status: 'SCHEDULED', audienceGroups: [] }, []), false);
});

test('ObjectId ও স্ট্রিং মেলে (String() তুলনা)', () => {
  const id = { toString: () => 'abc' };
  assert.equal(visibleToUser({ status: 'PUBLISHED', audienceGroups: [id] }, ['abc']), true);
});

test('নির্ধারিত সময়: ভবিষ্যতের হতে হবে, এক বছরের বেশি নয়', () => {
  assert.equal(scheduleProblem('2026-11-11T00:00:00Z', NOW), null);
  assert.ok(scheduleProblem('2026-11-10T11:00:00Z', NOW));
  assert.ok(scheduleProblem(NOW, NOW));
  assert.ok(scheduleProblem('2028-01-01T00:00:00Z', NOW));
  assert.ok(scheduleProblem('not-a-date', NOW));
});

test('অবস্থা পরিবর্তনের অনুমতি', () => {
  assert.equal(canTransition('DRAFT', 'publish'), true);
  assert.equal(canTransition('SCHEDULED', 'publish'), true);
  assert.equal(canTransition('PUBLISHED', 'publish'), false);
  assert.equal(canTransition('DRAFT', 'schedule'), true);
  assert.equal(canTransition('PUBLISHED', 'schedule'), false);
  assert.equal(canTransition('SCHEDULED', 'unschedule'), true);
  assert.equal(canTransition('DRAFT', 'unschedule'), false);
  assert.equal(canTransition('PUBLISHED', 'unpublish'), true);
  assert.equal(canTransition('DRAFT', 'unpublish'), false);
  assert.equal(canTransition('DRAFT', 'unknown'), false);
});
