import { User } from '../models/index.js';
import { ROLES, ACCOUNT_STATUS } from '../constants/index.js';
import { getSettings } from './settings.service.js';
import { awardPoints } from './points.service.js';
import { checkAchievements } from './achievement.service.js';
import { dhakaDay, nextStreak } from './streakRules.js';

// যাচাইযোগ্য শেখার কাজ (টাস্ক শুরু/জমা, ফোরামে পোস্ট/উত্তর) হলে ডাকা হয়। কখনো মূল কাজ আটকায় না।
export async function recordActivityDay(userId) {
  try {
    const user = await User.findById(userId).select('streak role status');
    if (!user || user.role !== ROLES.MEMBER || user.status !== ACCOUNT_STATUS.APPROVED) return;
    const today = dhakaDay();
    const n = nextStreak(user.streak, today);
    if (!n.changed) return;

    // শর্ত 'lastActiveDate != আজ': একই দিনে দুটি কাজ একসঙ্গে এলেও স্ট্রিক একবারই বাড়ে
    const r = await User.updateOne(
      { _id: userId, 'streak.lastActiveDate': { $ne: today } },
      { $set: { 'streak.current': n.current, 'streak.longest': n.longest, 'streak.lastActiveDate': today } }
    );
    if (!r.modifiedCount) return;

    const bonus = (await getSettings()).pointRules.dailyStreakBonus;
    if (bonus > 0) {
      await awardPoints({ userId, amount: bonus, reason: 'STREAK_BONUS', sourceKey: `streak:${userId}:${today}`, note: `স্ট্রিক ${n.current} দিন` });
    }
    await checkAchievements(userId);
  } catch (e) {
    console.error('স্ট্রিক হালনাগাদ ব্যর্থ:', e.message);
  }
}
