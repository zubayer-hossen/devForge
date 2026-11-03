import { PointTransaction, User } from '../models/index.js';
import { ACCOUNT_STATUS, ROLES } from '../constants/index.js';
import { periodStart, rankEntries } from './leaderboardRules.js';

// লিডারবোর্ডে শুধু অনুমোদিত সদস্য (MEMBER); অ্যাডমিন/মডারেটররা র‍্যাঙ্কিংয়ের বাইরে।
// সাপ্তাহিক/মাসিক হিসাব সরাসরি পয়েন্ট-খাতা (PointTransaction) থেকে; সর্বকালের হিসাব ব্যবহারকারীর মোট পয়েন্ট থেকে (যা খাতার যোগফল)।
export async function getLeaderboard(user, { period, limit }) {
  const members = await User.find({ status: ACCOUNT_STATUS.APPROVED, role: ROLES.MEMBER })
    .select('fullName username avatar points').lean();

  const totals = new Map();
  const start = periodStart(period);
  if (!start) {
    members.forEach((m) => totals.set(String(m._id), m.points || 0));
  } else {
    const rows = await PointTransaction.aggregate([
      { $match: { createdAt: { $gte: start }, user: { $in: members.map((m) => m._id) } } },
      { $group: { _id: '$user', total: { $sum: '$amount' } } },
    ]);
    rows.forEach((r) => totals.set(String(r._id), r.total));
  }

  const entries = members
    .map((m) => ({ user: { _id: m._id, fullName: m.fullName, username: m.username, avatar: m.avatar }, points: Math.max(0, totals.get(String(m._id)) || 0) }))
    .filter((e) => e.points > 0);
  const ranked = rankEntries(entries);
  const mine = ranked.find((e) => String(e.user._id) === String(user._id));
  return {
    period, start, total: ranked.length,
    entries: ranked.slice(0, limit),
    me: mine ? { rank: mine.rank, points: mine.points } : null,
    isMember: user.role === ROLES.MEMBER,
  };
}
