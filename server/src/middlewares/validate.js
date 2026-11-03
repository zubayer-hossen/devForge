import { AppError } from '../utils/AppError.js';

// ব্যবহার: validate(schema) অথবা validate(schema, 'query' | 'params')
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new AppError('প্রদত্ত তথ্যে ভুল আছে', 422, 'VALIDATION_ERROR', details));
  }
  req[source] = result.data;
  next();
};
