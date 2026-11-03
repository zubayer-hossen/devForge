import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

function normalize(err) {
  if (err instanceof AppError) return err;
  if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({ field: e.path, message: e.message }));
    return new AppError('তথ্য যাচাইয়ে ভুল পাওয়া গেছে', 422, 'VALIDATION_ERROR', details);
  }
  if (err?.name === 'CastError') return new AppError('অবৈধ আইডি বা মান', 400, 'INVALID_ID');
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return new AppError(`এই ${field} ইতিমধ্যে ব্যবহৃত হয়েছে`, 409, 'DUPLICATE_KEY');
  }
  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return new AppError('সেশন অবৈধ বা মেয়াদোত্তীর্ণ, আবার লগইন করুন', 401, 'INVALID_TOKEN');
  }
  if (err?.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'ফাইলের সাইজ সীমা ছাড়িয়ে গেছে' : 'ফাইল আপলোডে সমস্যা হয়েছে';
    return new AppError(msg, 400, 'UPLOAD_ERROR');
  }
  if (err?.type === 'entity.parse.failed') return new AppError('JSON ফরম্যাট সঠিক নয়', 400, 'INVALID_JSON');
  if (err?.type === 'entity.too.large') return new AppError('অনুরোধের আকার অনেক বড়', 413, 'PAYLOAD_TOO_LARGE');
  return new AppError('সার্ভারে অপ্রত্যাশিত সমস্যা হয়েছে', 500, 'INTERNAL_ERROR');
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const e = normalize(err);
  if (e.statusCode >= 500) console.error(err);
  res.status(e.statusCode).json({
    success: false,
    code: e.code,
    message: e.message,
    ...(e.details ? { details: e.details } : {}),
    ...(!env.isProd && e.statusCode >= 500 ? { stack: err?.stack } : {}),
  });
}
