import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.header('Authorization')?.replace('Bearer ', '') ||
    req.cookies?.accessToken;
  if (!token) throw new apiError(401, 'Access token required');

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decoded._id).select(
    '-password -refreshTokens'
  );
  if (!user) throw new apiError(401, 'Invalid access token');

  req.user = user;
  next();
});

export { verifyJWT };
