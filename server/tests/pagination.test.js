import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePagination, parseSort, escapeRegex } from '../src/utils/pagination.js';

test('pagination সীমা মানে', () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(parsePagination({ page: '3', limit: '10' }), { page: 3, limit: 10, skip: 20 });
  assert.equal(parsePagination({ limit: '99999' }).limit, 100);
  assert.equal(parsePagination({ page: '-5', limit: '0' }).page, 1);
});
test('sort শুধু অনুমোদিত ফিল্ড', () => {
  assert.equal(parseSort('-points', ['points']), '-points');
  assert.equal(parseSort('passwordHash', ['points']), '-createdAt');
});
test('regex escape', () => {
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
  assert.ok(new RegExp(escapeRegex('(x)')).test('(x)'));
});
test('ব্যাকঅফ সূত্র email.service.js-এর সঙ্গে সিঙ্কে আছে', () => {
  const src = readFileSync(new URL('../src/services/email/email.service.js', import.meta.url), 'utf8');
  assert.ok(src.includes('Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS)'));
  assert.ok(src.includes('BASE_DELAY_MS = 30_000') && src.includes('MAX_DELAY_MS = 60 * 60 * 1000'));
});
