import { AppError } from '../utils/AppError.js';

// SameSite=None কুকির কারণে CSRF ঝুঁকি কমাতে: পরিবর্তনকারী অনুরোধে কাস্টম হেডার বাধ্যতামূলক।
// ব্রাউজার ক্রস-সাইট কাস্টম হেডার পাঠাতে CORS preflight করে, আর CORS শুধু CLIENT_URL-কে অনুমতি দেয়।
export function csrfGuard(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'DevForge') {
    return next(new AppError('অনুরোধটি অনুমোদিত নয় (CSRF সুরক্ষা)', 403, 'CSRF_BLOCKED'));
  }
  next();
}
