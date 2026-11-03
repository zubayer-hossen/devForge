import http from 'http';
import { env, validateRequiredEnv, services } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import './config/cloudinary.js';
import * as models from './models/index.js';
import { createApp } from './app.js';
import { bootstrapSuperAdmin } from './services/bootstrap.service.js';
import { startEmailWorker, stopEmailWorker } from './jobs/emailWorker.js';
import { startAnnouncementScheduler, stopAnnouncementScheduler } from './jobs/announcementScheduler.js';
import { startDeadlineReminders, stopDeadlineReminders } from './jobs/deadlineReminder.js';
import { initSockets } from './sockets/index.js';

async function start() {
  validateRequiredEnv();
  await connectDB();
  await Promise.all(Object.values(models).map((m) => m.init())); // unique ইনডেক্স প্রস্তুত নিশ্চিত করা
  await bootstrapSuperAdmin();

  if (!services.turnstile()) console.warn('সতর্কতা: TURNSTILE_SECRET_KEY নেই, বট-যাচাই বন্ধ আছে।');
  const providerOk = env.emailProvider === 'resend' ? services.resend() : services.brevo();
  if (!providerOk) {
    console.warn(`সতর্কতা: ইমেইল প্রোভাইডার (${env.emailProvider}) কনফিগার করা নেই।${env.isProd ? ' ইমেইল পাঠানো যাবে না!' : ' ডেভেলপমেন্টে ইমেইল টার্মিনালে দেখানো হবে।'}`);
  }
  startEmailWorker();
  startAnnouncementScheduler();
  startDeadlineReminders();

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server); // রিয়েল-টাইম ঐচ্ছিক: সংযোগ না থাকলেও অ্যাপ পোলিংয়ে চলে
  server.listen(env.port, () => console.log(`DevForge API চালু হয়েছে: পোর্ট ${env.port}`));

  const shutdown = async (signal) => {
    console.log(`${signal} পাওয়া গেছে, সার্ভার বন্ধ হচ্ছে...`);
    stopEmailWorker();
    stopAnnouncementScheduler();
    stopDeadlineReminders();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('সার্ভার চালু করা যায়নি:', err.message);
  process.exit(1);
});
