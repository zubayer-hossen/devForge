export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
  static badRequest(msg = 'অনুরোধটি সঠিক নয়', details) { return new AppError(msg, 400, 'BAD_REQUEST', details); }
  static unauthorized(msg = 'লগইন করা প্রয়োজন') { return new AppError(msg, 401, 'UNAUTHORIZED'); }
  static forbidden(msg = 'এই কাজের অনুমতি আপনার নেই') { return new AppError(msg, 403, 'FORBIDDEN'); }
  static notFound(msg = 'খুঁজে পাওয়া যায়নি') { return new AppError(msg, 404, 'NOT_FOUND'); }
  static conflict(msg = 'এই তথ্য ইতিমধ্যে আছে') { return new AppError(msg, 409, 'CONFLICT'); }
  static tooMany(msg = 'অনেক বেশি অনুরোধ, একটু পরে চেষ্টা করুন') { return new AppError(msg, 429, 'TOO_MANY_REQUESTS'); }
}
