import { AppError } from '../utils/AppError.js';

export const notFound = (req, _res, next) =>
  next(new AppError(`এই রুট পাওয়া যায়নি: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
