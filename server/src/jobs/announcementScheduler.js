import { Announcement } from '../models/index.js';
import { publishAnnouncement } from '../services/announcement.service.js';

const TICK_MS = 60_000;
let timer = null;
let running = false;

// নির্ধারিত সময় পেরোনো ঘোষণা প্রকাশ করে। publishAnnouncement অ্যাটমিক দখল ব্যবহার করে,
// তাই একাধিক সার্ভার চললেও একই ঘোষণা দুইবার যায় না।
export async function tick() {
  if (running) return;
  running = true;
  try {
    const due = await Announcement.find({ status: 'SCHEDULED', publishAt: { $lte: new Date() } }).select('_id').lean();
    for (const { _id } of due) {
      try { await publishAnnouncement(_id, null, null); } catch (e) { if (e.statusCode !== 409) console.error('নির্ধারিত ঘোষণা প্রকাশ ব্যর্থ:', e.message); }
    }
  } finally {
    running = false;
  }
}

export function startAnnouncementScheduler() {
  if (timer) return;
  tick().catch((e) => console.error('শিডিউলার ত্রুটি:', e.message)); // সার্ভার বন্ধ থাকাকালীন পেরোনো ঘোষণা চালুর সঙ্গে সঙ্গে প্রকাশ
  timer = setInterval(() => tick().catch((e) => console.error('শিডিউলার ত্রুটি:', e.message)), TICK_MS);
  timer.unref();
}

export function stopAnnouncementScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}
