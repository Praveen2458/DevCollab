import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getTokenFromReq, verifyAccessToken } from '../services/tokenService.js';
import { User } from '../models/User.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) return next(new AppError('Not authenticated', 401));

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }

  const user = await User.findById(decoded.sub);
  if (!user) return next(new AppError('User no longer exists', 401));

  req.user = user;
  next();
});
