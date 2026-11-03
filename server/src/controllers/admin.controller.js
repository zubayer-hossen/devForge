import * as svc from '../services/admin.service.js';
import { sendTestEmail } from '../services/email/email.service.js';
import { emailProviderStatus } from '../services/email/providers.js';
import { logActivity } from '../services/activity.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const overview = asyncHandler(async (_req, res) => ok(res, await svc.getOverview()));
export const counts = asyncHandler(async (_req, res) => ok(res, await svc.getCounts()));

export const applications = asyncHandler(async (req, res) => ok(res, await svc.listApplications(req.query)));
export const decide = asyncHandler(async (req, res) =>
  ok(res, await svc.decideApplication(req.params.id, req.body, req.user, req), 'সিদ্ধান্ত সংরক্ষিত হয়েছে'));

export const members = asyncHandler(async (req, res) => ok(res, await svc.listMembers(req.query)));
export const member = asyncHandler(async (req, res) => ok(res, await svc.getMemberDetail(req.params.id)));
export const updateMember = asyncHandler(async (req, res) =>
  ok(res, await svc.updateMember(req.params.id, req.body, req.user, req), 'প্রোফাইল হালনাগাদ হয়েছে'));
export const suspend = asyncHandler(async (req, res) =>
  ok(res, await svc.suspendMember(req.params.id, req.body, req.user, req), 'সদস্যকে স্থগিত করা হয়েছে'));
export const reactivate = asyncHandler(async (req, res) =>
  ok(res, await svc.reactivateMember(req.params.id, req.user, req), 'সদস্যকে সক্রিয় করা হয়েছে'));
export const changeRole = asyncHandler(async (req, res) =>
  ok(res, await svc.changeMemberRole(req.params.id, req.body, req.user, req), 'রোল পরিবর্তন হয়েছে'));
export const removeMember = asyncHandler(async (req, res) => {
  await svc.deleteMember(req.params.id, req.user, req);
  ok(res, null, 'অ্যাকাউন্ট মুছে ফেলা হয়েছে');
});

export const activity = asyncHandler(async (req, res) => ok(res, await svc.listActivity(req.query)));

export const emailLogs = asyncHandler(async (req, res) =>
  ok(res, { ...(await svc.listEmailLogs(req.query)), provider: emailProviderStatus() }));
export const testEmail = asyncHandler(async (req, res) => {
  await sendTestEmail(req.body.to);
  await logActivity({ actor: req.user._id, action: 'TEST_EMAIL_SENT', metadata: { to: req.body.to }, req, isAudit: true });
  ok(res, null, 'টেস্ট ইমেইল কিউতে দেওয়া হয়েছে। ফলাফল "ইমেইল লগ"-এ দেখুন।');
});

export const getSettings = asyncHandler(async (_req, res) =>
  ok(res, { settings: await svc.getAdminSettings(), emailProvider: emailProviderStatus() }));
export const updateSettings = asyncHandler(async (req, res) =>
  ok(res, { settings: await svc.updateSettings(req.body, req.user, req), emailProvider: emailProviderStatus() }, 'সেটিংস সংরক্ষিত হয়েছে'));

export const uploadLogo = asyncHandler(async (req, res) =>
  ok(res, { settings: await svc.setLogo(req.file, req.user, req), emailProvider: emailProviderStatus() }, 'লোগো হালনাগাদ হয়েছে'));
export const deleteLogo = asyncHandler(async (req, res) =>
  ok(res, { settings: await svc.removeLogo(req.user, req), emailProvider: emailProviderStatus() }, 'লোগো সরানো হয়েছে'));

export const adjustPoints = asyncHandler(async (req, res) =>
  ok(res, await svc.adjustMemberPoints(req.params.id, req.body, req.user, req), 'পয়েন্ট সমন্বয় হয়েছে'));
export const pointLedger = asyncHandler(async (req, res) => ok(res, await svc.memberPointLedger(req.params.id)));
