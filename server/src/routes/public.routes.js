import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import { getSettings } from '../services/settings.service.js';

const r = Router();

// শুধু প্রকাশ্য তথ্য (পাবলিক ওয়েবসাইট, মেইনটেনেন্স ও রেজিস্ট্রেশন পেজের জন্য)
r.get('/settings', asyncHandler(async (_req, res) => {
  const s = await getSettings();
  ok(res, {
    siteName: s.siteName, siteDescription: s.siteDescription, logo: s.logo?.url || null,
    registrationOpen: s.registrationOpen, maintenanceMode: s.maintenanceMode,
    theme: s.theme, communityRules: s.communityRules,
  });
}));

export default r;
