import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEmail } from '../src/templates/email.templates.js';
import { backoffDelayForTest } from './helpers.js';

const URL = 'https://example.test';

test('OTP ইমেইলে কোড থাকে এবং নাম escape হয়', () => {
  const m = renderEmail('OTP', { name: '<script>alert(1)</script>', otp: '123456', minutes: 10 }, URL);
  assert.ok(m.subject.includes('123456'));
  assert.ok(m.text.includes('123456'));
  assert.ok(!m.html.includes('<script>'));
  assert.ok(m.html.includes('&lt;script&gt;'));
});

test('প্রতিটি টাইপের টেমপ্লেট subject/html/text দেয়', () => {
  const samples = {
    OTP: { name: 'রহিম', otp: '111111', minutes: 10 },
    WELCOME: { name: 'রহিম' }, APPROVAL: { name: 'রহিম' }, REJECTION: { name: 'রহিম', note: 'ধন্যবাদ' },
    PASSWORD_RESET: { name: 'রহিম', link: `${URL}/reset-password?token=x`, minutes: 30 },
    NEW_TASK: { name: 'রহিম', title: 'T', deadline: new Date(), taskId: '1' },
    DEADLINE_REMINDER: { name: 'রহিম', title: 'T', deadline: new Date(), taskId: '1' },
    SUBMISSION_RECEIVED: { name: 'রহিম', title: 'T' },
    SUBMISSION_REVIEW: { name: 'রহিম', title: 'T', decision: 'APPROVED', feedback: 'ভালো', points: 10 },
    REVISION_REQUEST: { name: 'রহিম', title: 'T', feedback: 'ঠিক করুন' },
    ANNOUNCEMENT: { name: 'রহিম', title: 'ঘোষণা', body: 'বিস্তারিত' },
    NEW_APPLICATION: { adminName: 'অ্যাডমিন', applicantName: 'রহিম', applicantEmail: 'r@x.com' },
    WAITLIST: { name: 'রহিম', note: 'অপেক্ষা করুন' },
    TEST: {},
  };
  for (const [type, data] of Object.entries(samples)) {
    const m = renderEmail(type, data, URL);
    assert.ok(m.subject && m.html && m.text, type);
  }
  assert.throws(() => renderEmail('NOPE', {}, URL));
});

test('এক্সপোনেনশিয়াল ব্যাকঅফ বাড়ে এবং ১ ঘণ্টায় সীমিত', () => {
  const d = backoffDelayForTest;
  assert.equal(d(1), 30_000);
  assert.equal(d(2), 60_000);
  assert.equal(d(3), 120_000);
  assert.equal(d(20), 3_600_000);
});
