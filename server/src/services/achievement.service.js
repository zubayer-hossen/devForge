import {
  Achievement, DiscussionPost, PointTransaction, Submission, TaskAssignment, User,
} from '../models/index.js';
import { CATALOG, catalogItem, earnedKeys } from './achievementCatalog.js';
import { createNotification } from './notification.service.js';

async function collectStats(userId) {
  const [user, forumPosts, submissions, approved, completedTasks, helpful] = await Promise.all([
    User.findById(userId).select('points streak').lean(),
    DiscussionPost.countDocuments({ author: userId }),
    Submission.countDocuments({ user: userId }),
    Submission.countDocuments({ user: userId, status: 'APPROVED' }),
    TaskAssignment.countDocuments({ user: userId, status: 'COMPLETED' }),
    PointTransaction.countDocuments({ user: userId, reason: 'HELPFUL_CONTRIBUTION', amount: { $gt: 0 } }),
  ]);
  if (!user) return null;
  return { forumPosts, submissions, approved, completedTasks, helpful, points: user.points || 0, longestStreak: user.streak?.longest || 0 };
}

// অর্জিত কিন্তু এখনো দেওয়া হয়নি এমন ব্যাজ দেয়। (user, key) অনন্য, তাই বারবার চালালেও দুইবার যায় না।
export async function checkAchievements(userId) {
  try {
    const stats = await collectStats(userId);
    if (!stats) return [];
    const have = new Set((await Achievement.find({ user: userId }).select('key').lean()).map((a) => a.key));
    const fresh = earnedKeys(stats).filter((k) => !have.has(k));
    const given = [];
    for (const key of fresh) {
      const item = catalogItem(key);
      try {
        await Achievement.create({ user: userId, key, title: item.title, description: item.hint, icon: item.icon });
        given.push(key);
        await createNotification({ user: userId, type: 'SYSTEM', title: `নতুন ব্যাজ: ${item.title}`, message: item.hint, link: '/dashboard/achievements', dedupeKey: `badge:${key}` });
      } catch (e) { if (e?.code !== 11000) throw e; }
    }
    return given;
  } catch (e) {
    console.error('ব্যাজ যাচাই ব্যর্থ:', e.message);
    return [];
  }
}

export async function badgesFor(userId) {
  const mine = new Map((await Achievement.find({ user: userId }).lean()).map((a) => [a.key, a]));
  return CATALOG.map((c) => ({ key: c.key, title: c.title, hint: c.hint, icon: c.icon, earned: mine.has(c.key), awardedAt: mine.get(c.key)?.awardedAt || null }));
}
