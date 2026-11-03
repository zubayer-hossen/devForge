import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { extensionAllowed, matchesSignature } from '../utils/fileSniff.js';
import { getSettings } from '../services/settings.service.js';

// অ্যাডমিন সেটিংসের সাইজ ও MIME-তালিকা মেনে একটি ফাইল গ্রহণ করে (মেমরিতে), এরপর আসল বিষয়বস্তুও যাচাই করে।
export function uploadSingle(field, { imagesOnly = false, maxMB, optional = false } = {}) {
  return asyncHandler(async (req, res, next) => {
    const settings = await getSettings();
    const limitMB = Math.min(maxMB ?? settings.upload.maxFileSizeMB, settings.upload.maxFileSizeMB);
    const allowed = settings.upload.allowedMimeTypes.filter((m) => !imagesOnly || m.startsWith('image/'));

    const parser = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: limitMB * 1024 * 1024, files: 1, fields: 5 },
      fileFilter: (_req, file, cb) => {
        if (!allowed.includes(file.mimetype)) return cb(AppError.badRequest('এই ধরনের ফাইল অনুমোদিত নয়'));
        if (!extensionAllowed(file.mimetype, file.originalname)) {
          return cb(AppError.badRequest('ফাইলের এক্সটেনশন তার ধরনের সঙ্গে মেলেনি'));
        }
        return cb(null, true);
      },
    }).single(field);

    parser(req, res, (err) => {
      if (err) return next(err);
      if (!req.file) return optional ? next() : next(AppError.badRequest('কোনো ফাইল পাওয়া যায়নি'));
      if (!matchesSignature(req.file.mimetype, req.file.buffer)) {
        return next(AppError.badRequest('ফাইলের আসল বিষয়বস্তু ঘোষিত ধরনের সঙ্গে মেলেনি'));
      }
      return next();
    });
  });
}

// multipart অনুরোধে JSON তথ্য 'data' ফিল্ডে আসে (ফাইলের সঙ্গে একই অনুরোধে); এটি req.body-তে তুলে দেয়
export function parseDataField(req, _res, next) {
  try {
    req.body = JSON.parse(req.body?.data ?? '{}');
    return next();
  } catch {
    return next(AppError.badRequest('অনুরোধের তথ্য সঠিক নয়'));
  }
}
