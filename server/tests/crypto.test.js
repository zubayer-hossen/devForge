import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOtp, hmacSha256, safeEqualHex, sha256, randomToken } from '../src/utils/crypto.js';

test('OTP সবসময় ৬ সংখ্যার', () => {
  for (let i = 0; i < 500; i++) assert.match(generateOtp(), /^[0-9]{6}$/);
});

test('OTP হ্যাশ নির্ধারিত এবং secret-নির্ভর', () => {
  assert.equal(hmacSha256('123456', 'a'), hmacSha256('123456', 'a'));
  assert.notEqual(hmacSha256('123456', 'a'), hmacSha256('123456', 'b'));
  assert.notEqual(hmacSha256('123456', 'a'), hmacSha256('654321', 'a'));
});

test('safeEqualHex সঠিক/ভুল/অবৈধ ইনপুট', () => {
  const h = sha256('x');
  assert.equal(safeEqualHex(h, sha256('x')), true);
  assert.equal(safeEqualHex(h, sha256('y')), false);
  assert.equal(safeEqualHex(h, 'abc'), false);
  assert.equal(safeEqualHex(undefined, h), false);
});

test('randomToken দৈর্ঘ্য ও অনন্যতা', () => {
  const a = randomToken(32), b = randomToken(32);
  assert.match(a, /^[a-f0-9]{64}$/);
  assert.notEqual(a, b);
});

import { parseCookieHeader } from '../src/utils/cookies.js';

test('কুকি হেডার পার্স: সাধারণ, ফাঁকা, বিকৃত', () => {
  assert.deepEqual(parseCookieHeader('a=1; df_access=abc.def.ghi; b=x%20y'), { a: '1', df_access: 'abc.def.ghi', b: 'x y' });
  assert.deepEqual(parseCookieHeader(''), {});
  assert.deepEqual(parseCookieHeader(undefined), {});
  assert.deepEqual(parseCookieHeader('bad=%E0%A4%A; ok=1'), { ok: '1' }, 'বিকৃত এনকোডিং বাদ, ক্র্যাশ নয়');
  assert.deepEqual(parseCookieHeader('novalue; =x; k=v=w'), { k: 'v=w' });
});
