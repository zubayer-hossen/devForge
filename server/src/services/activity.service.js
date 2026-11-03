import { ActivityLog } from '../models/index.js';

// লগ লিখতে ব্যর্থ হলে মূল কাজ যেন ব্যর্থ না হয়
export async function logActivity({ actor, action, targetType, targetId, metadata, req, isAudit = false }) {
  try {
    await ActivityLog.create({
      actor, action, targetType, targetId, metadata, isAudit,
      ip: req?.ip, userAgent: req?.get?.('user-agent')?.slice(0, 300),
    });
  } catch (e) {
    console.error('অ্যাক্টিভিটি লগ ব্যর্থ:', e.message);
  }
}
