import { EmailJob } from '../models/index.js';
import { processJob } from '../services/email/email.service.js';

const TICK_MS = 10_000;
const BATCH_SIZE = 20; // প্রতি চক্রে সর্বোচ্চ ইমেইল (প্রোভাইডারের সেন্ডিং লিমিট রক্ষায়)
const STUCK_AFTER_MS = 5 * 60 * 1000;

let timer = null;
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    await EmailJob.updateMany(
      { status: 'PROCESSING', updatedAt: { $lt: new Date(Date.now() - STUCK_AFTER_MS) } },
      { $set: { status: 'PENDING' } }
    );
    const due = await EmailJob.find({ status: 'PENDING', nextAttemptAt: { $lte: new Date() } })
      .sort('nextAttemptAt').limit(BATCH_SIZE).select('_id').lean();
    for (const { _id } of due) {
      await processJob(_id);
      await new Promise((r) => setTimeout(r, 250));
    }
  } finally {
    running = false;
  }
}

export function startEmailWorker() {
  if (timer) return;
  timer = setInterval(() => tick().catch((e) => console.error('ইমেইল ওয়ার্কার ত্রুটি:', e.message)), TICK_MS);
  timer.unref();
}

export function stopEmailWorker() {
  if (timer) clearInterval(timer);
  timer = null;
}
