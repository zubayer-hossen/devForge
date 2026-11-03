// email.service.js মঙ্গুস মডেল ইম্পোর্ট করে, তাই টেস্টে একই সূত্রটি আলাদা রাখা হয়েছে।
// সূত্র বদলালে email.service.js-এর backoffDelay-ও বদলাতে হবে (নিচে সোর্স-যাচাই টেস্ট আছে)।
export const backoffDelayForTest = (attempt) => Math.min(30_000 * 2 ** (attempt - 1), 60 * 60 * 1000);
