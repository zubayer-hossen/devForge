// ইমেইল টেমপ্লেট। ইমেইল ক্লায়েন্টের জন্য inline style ব্যবহার করা হয়েছে।
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmtDate(d) {
  try {
    return new Intl.DateTimeFormat('bn-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));
  } catch { return new Date(d).toISOString(); }
}

function layout({ heading, body, cta }) {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${esc(cta.url)}" style="background:#6d5dfc;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;display:inline-block">${esc(cta.label)}</a></p>`
    : '';
  return `<!doctype html><html lang="bn"><body style="margin:0;background:#0b1020;padding:24px;font-family:'Hind Siliguri','Noto Sans Bengali',Arial,sans-serif">
<table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#121935;border-radius:16px;border:1px solid #232c55"><tr><td style="padding:32px;color:#d7dcf5;font-size:16px;line-height:1.7">
<p style="margin:0 0 4px;color:#8b7bff;font-weight:700;font-size:18px">DevForge</p>
<h1 style="margin:0 0 16px;color:#fff;font-size:22px">${esc(heading)}</h1>
${body}${button}
<hr style="border:none;border-top:1px solid #232c55;margin:24px 0">
<p style="margin:0;color:#7f89b8;font-size:13px">Learn Together. Build Together. Grow Together.<br>আপনি এই ইমেইল চাননি? তাহলে এটি উপেক্ষা করুন।</p>
</td></tr></table></body></html>`;
}

const p = (t) => `<p style="margin:0 0 14px">${t}</p>`;

const builders = {
  OTP: ({ name, otp, minutes }) => ({
    subject: `আপনার DevForge ভেরিফিকেশন কোড: ${otp}`,
    html: layout({
      heading: 'ইমেইল যাচাই করুন',
      body: p(`হ্যালো ${esc(name)}, আপনার ভেরিফিকেশন কোড:`) +
        `<p style="font-size:34px;letter-spacing:10px;font-weight:700;color:#fff;background:#0b1020;border-radius:12px;text-align:center;padding:16px;margin:0 0 14px">${esc(otp)}</p>` +
        p(`এই কোড ${esc(minutes)} মিনিট পর্যন্ত বৈধ। কাউকে এই কোড বলবেন না।`),
    }),
    text: `হ্যালো ${name}, আপনার DevForge ভেরিফিকেশন কোড: ${otp} (${minutes} মিনিট বৈধ)। কাউকে এই কোড বলবেন না।`,
  }),
  WELCOME: ({ name }, url) => ({
    subject: 'DevForge-এ স্বাগতম!',
    html: layout({ heading: `স্বাগতম, ${name}!`, body: p('আপনার অ্যাকাউন্ট প্রস্তুত। আমরা একসঙ্গে শিখব, একসঙ্গে গড়ব।'), cta: { label: 'ড্যাশবোর্ডে যান', url: `${url}/dashboard` } }),
    text: `স্বাগতম, ${name}! আপনার অ্যাকাউন্ট প্রস্তুত: ${url}/dashboard`,
  }),
  APPROVAL: ({ name }, url) => ({
    subject: 'আপনার DevForge আবেদন অনুমোদিত হয়েছে',
    html: layout({ heading: 'অভিনন্দন! আপনি অনুমোদিত', body: p(`${esc(name)}, আপনার আবেদন অনুমোদিত হয়েছে। এখন লগইন করে ড্যাশবোর্ড ব্যবহার করতে পারবেন।`), cta: { label: 'লগইন করুন', url: `${url}/login` } }),
    text: `${name}, আপনার আবেদন অনুমোদিত হয়েছে। লগইন: ${url}/login`,
  }),
  REJECTION: ({ name, note }) => ({
    subject: 'আপনার DevForge আবেদনের ফলাফল',
    html: layout({ heading: 'আবেদন অনুমোদিত হয়নি', body: p(`${esc(name)}, দুঃখিত, এবার আপনার আবেদন গ্রহণ করা সম্ভব হয়নি।`) + (note ? p(`অ্যাডমিনের মন্তব্য: ${esc(note)}`) : '') }),
    text: `${name}, দুঃখিত, এবার আপনার আবেদন গ্রহণ করা সম্ভব হয়নি.${note ? ` মন্তব্য: ${note}` : ''}`,
  }),
  WAITLIST: ({ name, note }) => ({
    subject: 'আপনি DevForge ওয়েটলিস্টে আছেন',
    html: layout({ heading: 'আপনি ওয়েটলিস্টে আছেন', body: p(`${esc(name)}, আপনার আবেদন ভালো লেগেছে, তবে এই মুহূর্তে আসন পূর্ণ। জায়গা খালি হলে আপনাকে জানানো হবে।`) + (note ? p(`অ্যাডমিনের মন্তব্য: ${esc(note)}`) : '') }),
    text: `${name}, আপনি ওয়েটলিস্টে আছেন। জায়গা খালি হলে জানানো হবে.${note ? ` মন্তব্য: ${note}` : ''}`,
  }),
  PASSWORD_RESET: ({ name, link, minutes }) => ({
    subject: 'DevForge পাসওয়ার্ড রিসেট',
    html: layout({ heading: 'পাসওয়ার্ড রিসেট', body: p(`${esc(name)}, নতুন পাসওয়ার্ড সেট করতে নিচের বাটনে ক্লিক করুন। লিংকটি ${esc(minutes)} মিনিট বৈধ।`), cta: { label: 'পাসওয়ার্ড রিসেট করুন', url: link } }),
    text: `${name}, পাসওয়ার্ড রিসেট লিংক (${minutes} মিনিট বৈধ): ${link}`,
  }),
  NEW_TASK: ({ name, title, deadline, taskId }, url) => ({
    subject: `নতুন টাস্ক: ${title}`,
    html: layout({ heading: 'নতুন টাস্ক অ্যাসাইন হয়েছে', body: p(`${esc(name)}, আপনার জন্য নতুন টাস্ক: <strong>${esc(title)}</strong>`) + (deadline ? p(`ডেডলাইন: ${esc(fmtDate(deadline))}`) : ''), cta: { label: 'টাস্ক দেখুন', url: `${url}/dashboard/tasks/${taskId}` } }),
    text: `নতুন টাস্ক: ${title}${deadline ? ` | ডেডলাইন: ${fmtDate(deadline)}` : ''} | ${url}/dashboard/tasks/${taskId}`,
  }),
  DEADLINE_REMINDER: ({ name, title, deadline, taskId }, url) => ({
    subject: `ডেডলাইন রিমাইন্ডার: ${title}`,
    html: layout({ heading: 'ডেডলাইন ঘনিয়ে আসছে', body: p(`${esc(name)}, <strong>${esc(title)}</strong> টাস্কের ডেডলাইন: ${esc(fmtDate(deadline))}`), cta: { label: 'সাবমিট করুন', url: `${url}/dashboard/tasks/${taskId}` } }),
    text: `${name}, "${title}" টাস্কের ডেডলাইন: ${fmtDate(deadline)} | ${url}/dashboard/tasks/${taskId}`,
  }),
  SUBMISSION_RECEIVED: ({ name, title }) => ({
    subject: `সাবমিশন গৃহীত: ${title}`,
    html: layout({ heading: 'সাবমিশন পাওয়া গেছে', body: p(`${esc(name)}, আপনার "${esc(title)}" সাবমিশন জমা হয়েছে। রিভিউয়ের পর জানানো হবে।`) }),
    text: `${name}, আপনার "${title}" সাবমিশন জমা হয়েছে।`,
  }),
  SUBMISSION_REVIEW: ({ name, title, decision, feedback, points }) => ({
    subject: `সাবমিশন রিভিউ: ${title}`,
    html: layout({ heading: 'আপনার সাবমিশন রিভিউ হয়েছে', body: p(`${esc(name)}, "${esc(title)}" — ফলাফল: <strong>${esc(decision)}</strong>`) + (points ? p(`পয়েন্ট: ${esc(points)}`) : '') + (feedback ? p(`ফিডব্যাক: ${esc(feedback)}`) : '') }),
    text: `"${title}" — ফলাফল: ${decision}${points ? ` | পয়েন্ট: ${points}` : ''}${feedback ? ` | ফিডব্যাক: ${feedback}` : ''}`,
  }),
  REVISION_REQUEST: ({ name, title, feedback }, url) => ({
    subject: `রিভিশন প্রয়োজন: ${title}`,
    html: layout({ heading: 'রিভিশন প্রয়োজন', body: p(`${esc(name)}, "${esc(title)}" সাবমিশনে কিছু পরিবর্তন দরকার।`) + (feedback ? p(`ফিডব্যাক: ${esc(feedback)}`) : ''), cta: { label: 'আপডেট করুন', url: `${url}/dashboard/submissions` } }),
    text: `"${title}" সাবমিশনে পরিবর্তন দরকার।${feedback ? ` ফিডব্যাক: ${feedback}` : ''}`,
  }),
  ANNOUNCEMENT: ({ name, title, body }, url) => ({
    subject: `ঘোষণা: ${title}`,
    html: layout({ heading: title, body: p(`হ্যালো ${esc(name)},`) + `<div style="white-space:pre-wrap;margin:0 0 14px">${esc(body)}</div>`, cta: { label: 'ড্যাশবোর্ডে দেখুন', url: `${url}/dashboard/announcements` } }),
    text: `${title}\n\n${body}`,
  }),
  NEW_APPLICATION: ({ adminName, applicantName, applicantEmail }, url) => ({
    subject: `নতুন আবেদন: ${applicantName}`,
    html: layout({ heading: 'নতুন আবেদন রিভিউয়ের অপেক্ষায়', body: p(`${esc(adminName)}, <strong>${esc(applicantName)}</strong> (${esc(applicantEmail)}) ইমেইল যাচাই শেষ করে আবেদন জমা দিয়েছেন।`), cta: { label: 'আবেদন রিভিউ করুন', url: `${url}/admin/applications` } }),
    text: `নতুন আবেদন: ${applicantName} (${applicantEmail}) | ${url}/admin/applications`,
  }),
  TEST: () => ({
    subject: 'DevForge টেস্ট ইমেইল',
    html: layout({ heading: 'ইমেইল সেটআপ কাজ করছে', body: p('এটি একটি টেস্ট ইমেইল। আপনি এটি পেয়েছেন মানে ইমেইল প্রোভাইডার ঠিকভাবে কনফিগার হয়েছে।') }),
    text: 'এটি একটি টেস্ট ইমেইল। ইমেইল প্রোভাইডার ঠিকভাবে কনফিগার হয়েছে।',
  }),
};

export function renderEmail(type, data, clientUrl) {
  const build = builders[type];
  if (!build) throw new Error(`অজানা ইমেইল টাইপ: ${type}`);
  return build(data, clientUrl);
}
