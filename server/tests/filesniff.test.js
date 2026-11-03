import test from 'node:test';
import assert from 'node:assert/strict';
import { extensionAllowed, matchesSignature } from '../src/utils/fileSniff.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const gif = Buffer.from('GIF89a....');
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBPVP8 ')]);
const pdf = Buffer.from('%PDF-1.7\n...');
const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0]);
const html = Buffer.from('<html><script>alert(1)</script></html>');

test('সঠিক signature চেনা যায়', () => {
  assert.equal(matchesSignature('image/jpeg', jpeg), true);
  assert.equal(matchesSignature('image/png', png), true);
  assert.equal(matchesSignature('image/gif', gif), true);
  assert.equal(matchesSignature('image/webp', webp), true);
  assert.equal(matchesSignature('application/pdf', pdf), true);
  assert.equal(matchesSignature('application/zip', zip), true);
});
test('MIME জাল করা ফাইল ধরা পড়ে (HTML-কে ছবি বলা)', () => {
  assert.equal(matchesSignature('image/png', html), false);
  assert.equal(matchesSignature('image/jpeg', png), false);
  assert.equal(matchesSignature('application/pdf', zip), false);
  assert.equal(matchesSignature('image/jpeg', Buffer.alloc(2)), false);
});
test('অজানা MIME বা অবৈধ ইনপুট প্রত্যাখ্যাত', () => {
  assert.equal(matchesSignature('image/svg+xml', html), false);
  assert.equal(matchesSignature('image/png', null), false);
  assert.equal(matchesSignature('image/png', 'string'), false);
});
test('টেক্সট ও JSON যাচাই', () => {
  assert.equal(matchesSignature('text/plain', Buffer.from('hello')), true);
  assert.equal(matchesSignature('text/plain', Buffer.from([65, 0, 66])), false);
  assert.equal(matchesSignature('application/json', Buffer.from('{"a":1}')), true);
  assert.equal(matchesSignature('application/json', Buffer.from('{bad')), false);
});
test('এক্সটেনশন ও MIME মিল', () => {
  assert.equal(extensionAllowed('image/jpeg', 'me.JPG'), true);
  assert.equal(extensionAllowed('image/jpeg', 'me.png'), false);
  assert.equal(extensionAllowed('image/png', 'shell.php.png'), true);
  assert.equal(extensionAllowed('image/png', 'noext'), false);
  assert.equal(extensionAllowed('application/pdf', undefined), false);
});
