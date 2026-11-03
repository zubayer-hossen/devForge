// জনপ্রিয় অস্থায়ী (disposable) ইমেইল ডোমেইনের তালিকা। এটি সম্পূর্ণ নয়; সময়ে সময়ে বাড়ানো যাবে।
const DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
  'sharklasers.com', 'grr.la', 'spam4.me', '10minutemail.com', '10minutemail.net', 'temp-mail.org',
  'temp-mail.io', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempmailaddress.com', 'tempr.email',
  'throwawaymail.com', 'yopmail.com', 'yopmail.net', 'getnada.com', 'nada.email', 'trashmail.com',
  'trashmail.net', 'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'mailnesia.com', 'mintemail.com',
  'mohmal.com', 'emailondeck.com', 'spamgourmet.com', 'mytemp.email', 'tempinbox.com', 'moakt.com',
  'burnermail.io', 'inboxkitten.com', 'discard.email', 'mailcatch.com', 'mailforspam.com', 'tmpmail.org',
  'tmpmail.net', 'emailfake.com', 'fakemail.net', 'minuteinbox.com', 'tempail.com', 'harakirimail.com',
  'anonbox.net', 'mailtemp.info', '1secmail.com', '1secmail.org', '1secmail.net', 'dropmail.me',
  'mail.tm', 'owlymail.com', 'luxusmail.org',
];
const SET = new Set(DOMAINS);

export function isDisposableEmail(email) {
  const domain = String(email).split('@')[1]?.toLowerCase();
  if (!domain) return true;
  if (SET.has(domain)) return true;
  return [...SET].some((d) => domain.endsWith(`.${d}`));
}
