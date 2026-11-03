import { PointTransaction, User } from '../models/index.js';
import { badgesFor } from './achievement.service.js';
import { dhakaDay, effectiveCurrent } from './streakRules.js';

export async function getProgress(user) {
  const [fresh, badges, ledger] = await Promise.all([
    User.findById(user._id).select('points streak').lean(),
    badgesFor(user._id),
    PointTransaction.find({ user: user._id }).sort('-createdAt').limit(30).select('amount reason note createdAt').lean(),
  ]);
  const s = fresh.streak || {};
  return {
    points: fresh.points || 0,
    streak: { current: effectiveCurrent(s, dhakaDay()), longest: s.longest || 0, lastActiveDate: s.lastActiveDate || null },
    badges, ledger,
  };
}
