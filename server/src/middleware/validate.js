import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    return next(new AppError(details || 'Invalid request', 400));
  }

  req.validated = parsed.data;
  next();
};
