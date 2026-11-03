export const getErrorMessage = (err, fallback = 'কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন') => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'সার্ভার সাড়া দিচ্ছে না, আবার চেষ্টা করুন';
  if (err?.message === 'Network Error') return 'সার্ভারের সঙ্গে সংযোগ করা যাচ্ছে না। ইন্টারনেট ও সার্ভার চালু আছে কি না দেখুন।';
  return fallback;
};

export const getErrorCode = (err) => err?.response?.data?.code;
export const getErrorDetails = (err) => err?.response?.data?.details;

// বার্তার সঙ্গে ফিল্ড-ভিত্তিক বিবরণও জুড়ে দেয় (যেমন ভ্যালিডেশন ত্রুটি)
export const getErrorSummary = (err) => {
  const base = getErrorMessage(err);
  const d = getErrorDetails(err);
  return Array.isArray(d) && d.length ? `${base}: ${d.map((x) => x.message).join(', ')}` : base;
};
