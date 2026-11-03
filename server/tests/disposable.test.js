import test from 'node:test';
import assert from 'node:assert/strict';
import { isDisposableEmail } from '../src/utils/disposableDomains.js';

test('disposable ডোমেইন ধরা পড়ে', () => {
  assert.equal(isDisposableEmail('a@mailinator.com'), true);
  assert.equal(isDisposableEmail('a@sub.yopmail.com'), true);
  assert.equal(isDisposableEmail('A@MAILINATOR.COM'), true);
});
test('সাধারণ ডোমেইন গ্রহণযোগ্য', () => {
  assert.equal(isDisposableEmail('a@gmail.com'), false);
  assert.equal(isDisposableEmail('a@outlook.com'), false);
});
test('অবৈধ ইমেইল প্রত্যাখ্যাত', () => assert.equal(isDisposableEmail('nodomain'), true));
