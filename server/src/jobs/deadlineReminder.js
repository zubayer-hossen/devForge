import { Task, TaskAssignment, User } from '../models/index.js';
import { ACCOUNT_STATUS } from '../constants/index.js';
import { getSettings } from '../services/settings.service.js';
import { createNotification } from '../services/notification.service.js';
import { enqueueEmail } from '../services/email/email.service.js';
import { OPEN_STATUSES } from '../services/taskRules.js';

const TICK_MS = 15 * 60 * 1000;
let timer = null;
let running = false;

// ডেডলাইনের নির্ধারিত ঘণ্টা আগে, যাদের কাজ বাকি তাদের একবার রিমাইন্ডার পাঠায়।
// reminderSentAt-এর অ্যাটমিক দখলের কারণে একাধিক সার্ভার চললেও রিমাইন্ডার দুইবার যায় না।
export async function tick() {
  if (running) return;
  running = true;
  try {
    const settings = await getSettings();
    const now = new Date();
    const horizon = new Date(now.getTime() + settings.notifications.deadlineReminderHours * 3_600_000);
    const tasks = await Task.find({
      status: 'PUBLISHED', deadline: { $gt: now, $lte: horizon }, $or: [{ reminderSentAt: null }, { reminderSentAt: { $exists: false } }],
    }).select('title deadline').lean();

    for (const t of tasks) {
      const claim = await Task.updateOne(
        { _id: t._id, $or: [{ reminderSentAt: null }, { reminderSentAt: { $exists: false } }] },
        { $set: { reminderSentAt: now } }
      );
      if (!claim.modifiedCount) continue;

      const open = await TaskAssignment.find({ task: t._id, status: { $in: OPEN_STATUSES } }).select('user').lean();
      const users = await User.find({ _id: { $in: open.map((a) => a.user) }, status: ACCOUNT_STATUS.APPROVED }).select('email fullName').lean();
      for (const u of users) {
        if (settings.notifications.inApp) {
          await createNotification({
            user: u._id, type: 'DEADLINE_REMINDER', title: `ডেডলাইন ঘনিয়ে আসছে: ${t.title}`,
            link: `/dashboard/tasks/${t._id}`, dedupeKey: `deadline:${t._id}`,
          });
        }
        if (settings.notifications.emailOnDeadline !== false) {
          await enqueueEmail({
            to: u.email, type: 'DEADLINE_REMINDER', processNow: false, dedupeKey: `deadline:${t._id}:${u._id}`,
            data: { name: u.fullName, title: t.title, deadline: t.deadline, taskId: String(t._id) },
          });
        }
      }
    }
  } finally {
    running = false;
  }
}

export function startDeadlineReminders() {
  if (timer) return;
  timer = setInterval(() => tick().catch((e) => console.error('রিমাইন্ডার জব ত্রুটি:', e.message)), TICK_MS);
  timer.unref();
  tick().catch((e) => console.error('রিমাইন্ডার জব ত্রুটি:', e.message));
}

export function stopDeadlineReminders() {
  if (timer) clearInterval(timer);
  timer = null;
}
