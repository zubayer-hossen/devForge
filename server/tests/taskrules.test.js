import test from 'node:test';
import assert from 'node:assert/strict';
import { canSubmitNow, isOverdue, linkHostAllowed, publishProblem } from '../src/services/taskRules.js';

const NOW = new Date('2026-11-10T12:00:00Z');
const past = '2026-11-01T00:00:00Z';
const future = '2026-12-01T00:00:00Z';

test('isOverdue: শুধু খোলা অবস্থায় এবং ডেডলাইন পেরোলে', () => {
  assert.equal(isOverdue('ASSIGNED', past, NOW), true);
  assert.equal(isOverdue('IN_PROGRESS', past, NOW), true);
  assert.equal(isOverdue('ASSIGNED', future, NOW), false);
  assert.equal(isOverdue('COMPLETED', past, NOW), false);
  assert.equal(isOverdue('SUBMITTED', past, NOW), false);
  assert.equal(isOverdue('ASSIGNED', null, NOW), false);
});

test('canSubmitNow: প্রকাশিত, ডেডলাইন ও late-submission', () => {
  assert.equal(canSubmitNow({ status: 'PUBLISHED', deadline: future }, NOW), true);
  assert.equal(canSubmitNow({ status: 'PUBLISHED' }, NOW), true);
  assert.equal(canSubmitNow({ status: 'PUBLISHED', deadline: past }, NOW), false);
  assert.equal(canSubmitNow({ status: 'PUBLISHED', deadline: past, allowLateSubmission: true }, NOW), true);
  assert.equal(canSubmitNow({ status: 'CLOSED', deadline: future, allowLateSubmission: true }, NOW), false);
  assert.equal(canSubmitNow({ status: 'DRAFT' }, NOW), false);
  assert.equal(canSubmitNow(null, NOW), false);
});

test('linkHostAllowed: ডোমেইন ও সাবডোমেইন, জাল ডোমেইন নয়', () => {
  assert.equal(linkHostAllowed('https://www.figma.com/file/abc', ['figma.com']), true);
  assert.equal(linkHostAllowed('https://github.com/a/b', ['github.com']), true);
  assert.equal(linkHostAllowed('https://gist.github.com/a', ['github.com']), true);
  assert.equal(linkHostAllowed('https://github.com.evil.io/x', ['github.com']), false);
  assert.equal(linkHostAllowed('https://evilgithub.com/x', ['github.com']), false);
  assert.equal(linkHostAllowed('not a url', ['github.com']), false);
  assert.equal(linkHostAllowed('https://docs.google.com/d/1', ['drive.google.com', 'docs.google.com']), true);
});

test('publishProblem: প্রকাশের আগের যাচাই', () => {
  assert.equal(publishProblem({ assignTo: 'ALL' }, NOW), null);
  assert.ok(publishProblem({ assignTo: 'SELECTED', assignedUsers: [] }, NOW));
  assert.equal(publishProblem({ assignTo: 'SELECTED', assignedUsers: ['a'] }, NOW), null);
  assert.ok(publishProblem({ assignTo: 'GROUPS', assignedGroups: [] }, NOW));
  assert.ok(publishProblem({ assignTo: 'ALL', deadline: past }, NOW));
  assert.equal(publishProblem({ assignTo: 'ALL', deadline: past, allowLateSubmission: true }, NOW), null);
  assert.equal(publishProblem({ assignTo: 'ALL', deadline: future }, NOW), null);
});
