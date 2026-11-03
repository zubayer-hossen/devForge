import { PointTransaction, User } from '../models/index.js';

// ব্যবহারকারীর মোট পয়েন্ট সবসময় লেনদেনের যোগফল থেকে হিসাব হয়; $inc নয়।
// তাই মাঝপথে কিছু ভেঙে গেলেও পরের বার হিসাব নিজে ঠিক হয়ে যায়।
export async function recalculatePoints(userId) {
  const [row] = await PointTransaction.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const total = Math.max(0, row?.total || 0);
  await User.updateOne({ _id: userId }, { $set: { points: total } });
  return total;
}

// sourceKey অনন্য: একই উৎসে দ্বিতীয়বার পয়েন্ট দেওয়ার চেষ্টা নীরবে বাতিল হয় (null ফেরত)
export async function awardPoints({ userId, amount, reason, sourceKey, note, awardedBy }) {
  if (!Number.isInteger(amount) || amount <= 0) return null;
  try {
    await PointTransaction.create({ user: userId, amount, reason, sourceKey, note, awardedBy });
  } catch (e) {
    if (e?.code === 11000) return null;
    throw e;
  }
  await recalculatePoints(userId);
  return amount;
}

// মোট (ঋণাত্মক হওয়া ঠেকাতে ধাপ-ধাপে যাচাইয়ের জন্য) — ছাঁটা নয়, আসল যোগফল
export async function rawPointTotal(userId) {
  const [row] = await PointTransaction.aggregate([{ $match: { user: userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return row?.total || 0;
}

// অ্যাডমিনের হাতে সমন্বয়: ধনাত্মক বা ঋণাত্মক পূর্ণ সংখ্যা। মোট পয়েন্ট শূন্যের নিচে নামানো যায় না।
export async function adjustPoints({ userId, amount, reason, sourceKey, note, awardedBy }) {
  if (!Number.isInteger(amount) || amount === 0) throw new Error('পয়েন্ট শূন্য ছাড়া পূর্ণ সংখ্যা হতে হবে');
  if ((await rawPointTotal(userId)) + amount < 0) return { ok: false, reason: 'BELOW_ZERO' };
  await PointTransaction.create({ user: userId, amount, reason, sourceKey, note, awardedBy });
  return { ok: true, total: await recalculatePoints(userId) };
}
