import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.get('Authorization') || req.headers['authorization'];
  const token = authHeader?.replace('Bearer ', '') || req.cookies?.accessToken;
  if (!token) throw new apiError(401, 'Access token required');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      throw new apiError(
        401,
        error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
      );
    }
    throw error;
  }

  const user = await User.findById(decoded._id)
    .select('_id username email fullName avatarUrl role isBanned bannedUntil')
    .lean();
  if (!user) throw new apiError(401, 'Invalid access token');

  const banExpired =
    user.bannedUntil && new Date(user.bannedUntil) <= new Date();
  if (user.isBanned && !banExpired) {
    throw new apiError(403, 'Account is temporarily restricted');
  }

  req.user = user;
  next();
});

// Optional JWT verification - doesn't throw error if no token
const optionalJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.get('Authorization') || req.headers['authorization'];
  const token = authHeader?.replace('Bearer ', '') || req.cookies?.accessToken;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id)
      .select('_id username email fullName avatarUrl role isBanned bannedUntil')
      .lean();
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }

  next();
});

export { verifyJWT, optionalJWT };
