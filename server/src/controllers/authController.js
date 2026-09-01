import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import { clearAuthCookie, setAuthCookie, signAccessToken } from '../services/tokenService.js';

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 409);

  const user = await User.create({ name, email, password });

  const token = signAccessToken({ sub: user._id.toString() });
  setAuthCookie(res, token);

  res.status(201).json({ user, token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid credentials', 401);

  const ok = await user.comparePassword(password);
  if (!ok) throw new AppError('Invalid credentials', 401);

  const token = signAccessToken({ sub: user._id.toString() });
  setAuthCookie(res, token);

  const safeUser = await User.findById(user._id);
  res.json({ user: safeUser, token });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
