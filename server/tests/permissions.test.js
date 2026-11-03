import test from 'node:test';
import assert from 'node:assert/strict';
import { canManageUser, canChangeRole } from '../src/services/permissions.js';

const u = (id, role) => ({ _id: id, role });
const sa = u('1', 'SUPER_ADMIN'), ad = u('2', 'ADMIN'), mod = u('3', 'MODERATOR'), m = u('4', 'MEMBER'), ad2 = u('5', 'ADMIN');

test('কেউ নিজেকে ম্যানেজ করতে পারে না', () => {
  for (const x of [sa, ad, mod, m]) assert.equal(canManageUser(x, x), false);
});
test('SUPER_ADMIN কে কেউ ম্যানেজ করতে পারে না', () => {
  assert.equal(canManageUser(ad, sa), false);
  assert.equal(canManageUser(u('9', 'SUPER_ADMIN'), sa), false);
});
test('SUPER_ADMIN সবাইকে (SUPER_ADMIN বাদে) ম্যানেজ করতে পারে', () => {
  for (const t of [ad, mod, m]) assert.equal(canManageUser(sa, t), true);
});
test('ADMIN শুধু MEMBER ও MODERATOR ম্যানেজ করে, অন্য ADMIN নয়', () => {
  assert.equal(canManageUser(ad, m), true);
  assert.equal(canManageUser(ad, mod), true);
  assert.equal(canManageUser(ad, ad2), false);
});
test('MODERATOR ও MEMBER কাউকে ম্যানেজ করতে পারে না', () => {
  assert.equal(canManageUser(mod, m), false);
  assert.equal(canManageUser(m, mod), false);
});
test('শুধু SUPER_ADMIN রোল বদলায়; SUPER_ADMIN রোল দেওয়া যায় না', () => {
  assert.equal(canChangeRole(sa, m, 'MODERATOR'), true);
  assert.equal(canChangeRole(sa, mod, 'ADMIN'), true);
  assert.equal(canChangeRole(sa, m, 'SUPER_ADMIN'), false);
  assert.equal(canChangeRole(ad, m, 'MODERATOR'), false);
  assert.equal(canChangeRole(sa, sa, 'ADMIN'), false);
});
