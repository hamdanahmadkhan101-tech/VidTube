import jwt from 'jsonwebtoken';
import { User } from '../../models/user.model.js';
import bcrypt from 'bcryptjs';

/**
 * Generate a test JWT token for a user
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
export const generateTestToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  });
};

/**
 * Create a test user in the database
 * @param {Object} userData - User data (optional)
 * @returns {Promise<Object>} Created user document
 */
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    fullName: 'Test User',
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'Test123456',
    avatarUrl: 'https://example.com/avatar.jpg',
    ...userData,
  };

  const user = await User.create(defaultUser);
  return user;
};

/**
 * Create and login a test user (returns user + token)
 * @param {Object} userData - User data (optional)
 * @returns {Promise<Object>} { user, token }
 */
export const createAndLoginTestUser = async (userData = {}) => {
  const user = await createTestUser(userData);
  const token = generateTestToken(user._id.toString());
  
  // Add refresh token to user
  const refreshToken = jwt.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  });
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  return {
    user: await User.findById(user._id).select('-password -refreshTokens'),
    token,
    refreshToken,
  };
};

/**
 * Create a test video
 * @param {string} ownerId - Owner user ID
 * @param {Object} videoData - Video data (optional)
 * @returns {Promise<Object>} Created video document
 */
export const createTestVideo = async (ownerId, videoData = {}) => {
  const Video = (await import('../../models/video.model.js')).default;
  
  const defaultVideo = {
    title: 'Test Video',
    description: 'Test video description',
    url: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    duration: 120,
    videoformat: 'mp4',
    owner: ownerId,
    isPublished: true,
    views: 0,
    ...videoData,
  };

  const video = await Video.create(defaultVideo);
  return video;
};
