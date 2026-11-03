import * as svc from '../services/member.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const dashboard = asyncHandler(async (req, res) => ok(res, await svc.getDashboard(req.user)));
export const updateProfile = asyncHandler(async (req, res) =>
  ok(res, { user: await svc.updateProfile(req.user, req.body, req) }, 'প্রোফাইল হালনাগাদ হয়েছে'));
export const uploadAvatar = asyncHandler(async (req, res) =>
  ok(res, { user: await svc.setAvatar(req.user, req.file, req) }, 'প্রোফাইল ছবি হালনাগাদ হয়েছে'));
export const deleteAvatar = asyncHandler(async (req, res) =>
  ok(res, { user: await svc.removeAvatar(req.user, req) }, 'প্রোফাইল ছবি সরানো হয়েছে'));
