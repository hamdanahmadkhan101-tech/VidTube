// ============================================
// IMPORTS & DEPENDENCIES
// ============================================
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Models
import { User } from '../models/user.model.js';
import Subscription from '../models/subscription.model.js';
// Note: Video collection referenced by name in aggregation pipeline

import Video from '../models/video.model.js';

// Services
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import { createNotificationAndEmit } from '../services/notification.service.js';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate access and refresh tokens for a user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Object} Object containing accessToken and refreshToken
 */

const generateAcessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new apiError(404, 'User not found');
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await User.findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          $each: [refreshToken],
          $slice: -5,
        },
      },
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, 'Token generation failed');
  }
};

const getRefreshCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    path: '/',
  };
};

// ============================================
// AUTHENTICATION CONTROLLERS
// ============================================

/**
 * Register a new user with avatar and optional cover image
 * @route POST /api/v1/users/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  // console.log(req.body);

  if (!fullName || !username || !email || !password) {
    throw new apiError(400, 'All fields are required');
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedUsername = String(username).toLowerCase().trim();

  const checkUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  });
  if (checkUser) {
    const field = checkUser.email === email ? 'email' : 'username';
    throw new apiError(409, `User with this ${field} already exists`);
  }

  const avatarPath = req.files?.avatar?.[0]?.path ?? null;
  const coverPath = req.files?.coverImage?.[0]?.path ?? null;
  // console.log(req.files);

  // Avatar is now optional - upload only if provided
  const avatarUploadResult = avatarPath
    ? await uploadOnCloudinary(avatarPath)
    : null;
  const coverUploadResult = coverPath
    ? await uploadOnCloudinary(coverPath)
    : null;

  const newUser = await User.create({
    fullName,
    username: normalizedUsername,
    email: normalizedEmail,
    password,
    avatarUrl: avatarUploadResult?.url || '',
    coverUrl: coverUploadResult?.url || '',
  });

  const createdUser = await User.findById(newUser._id).select(
    '-password -refreshTokens'
  );

  if (!createdUser) {
    throw new apiError(500, 'User registration failed');
  }

  res
    .status(201)
    .json(new apiResponse(201, 'User registered successfully', createdUser));
});

/**
 * Authenticate user with email/username and password
 * @route POST /api/v1/users/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new apiError(400, 'Please provide either email or username to login');
  }

  if (email && typeof email !== 'string')
    throw new apiError(400, 'Invalid email');
  if (username && typeof username !== 'string')
    throw new apiError(400, 'Invalid username');

  if (!password) {
    throw new apiError(400, 'Password is required');
  }

  const normalizedEmail =
    typeof email === 'string' ? email.toLowerCase().trim() : undefined;
  const normalizedUsername =
    typeof username === 'string' ? username.toLowerCase().trim() : undefined;

  const user = await User.findOne({
    $or: [
      ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ...(normalizedUsername ? [{ username: normalizedUsername }] : []),
    ],
  });

  if (!user) {
    throw new apiError(401, 'Invalid credentials');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new apiError(401, 'Invalid credentials');
  }

  const tokens = await generateAcessAndRefreshTokens(user._id);
  const userData = await User.findById(user._id).select(
    '-password -refreshTokens'
  );

  const options = getRefreshCookieOptions();
  res
    .status(200)
    .cookie('refreshToken', tokens.refreshToken, options)
    .json(
      new apiResponse(200, 'User logged in successfully', {
        user: userData,
        accessToken: tokens.accessToken,
      })
    );
});

/**
 * Logout user and remove refresh token
 * @route POST /api/v1/users/logout
 * @access Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    throw new apiError(401, 'User not authenticated');
  }

  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { refreshTokens: refreshToken } },
      { new: true }
    );
  }

  const options = getRefreshCookieOptions();
  res
    .status(200)
    .clearCookie('refreshToken', options)
    .json(new apiResponse(200, 'User logged out successfully'));
});

/**
 * Refresh access token using refresh token
 * @route POST /api/v1/users/refresh-token
 * @access Public
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, 'Unauthorized request');
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new apiError(401, 'Invalid refresh token');
  }

  if (!user.refreshTokens?.includes(incomingRefreshToken)) {
    throw new apiError(401, 'Refresh token is expired or used');
  }

  // Remove old refresh token
  await User.findByIdAndUpdate(
    user._id,
    { $pull: { refreshTokens: incomingRefreshToken } },
    { new: true }
  );

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAcessAndRefreshTokens(user._id);

  const options = getRefreshCookieOptions();

  return res
    .status(200)
    .cookie('refreshToken', newRefreshToken, options)
    .json(
      new apiResponse(200, 'Access token refreshed', {
        accessToken,
      })
    );
});

// ============================================
// ACCOUNT SECURITY CONTROLLERS
// ============================================

/**
 * Change user's current password
 * @route PATCH /api/v1/users/change-password
 * @access Private
 */
const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new apiError(400, 'Current password and new password are required');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(404, 'User not found');
  }
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new apiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  user.refreshTokens = []; // Clear all refresh tokens for security
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(
      new apiResponse(200, 'Password changed successfully. Please login again.')
    );
});

// ============================================
// PROFILE MANAGEMENT CONTROLLERS
// ============================================

/**
 * Get current user's profile information with subscriber count
 * @route GET /api/v1/users/profile
 * @access Private
 */
const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const userProfile = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: '$subscribers' },
        subscribedToCount: { $size: '$subscribedTo' },
      },
    },
    {
      $project: {
        password: 0,
        refreshTokens: 0,
        subscribers: 0,
        subscribedTo: 0,
      },
    },
  ]);

  if (!userProfile || userProfile.length === 0) {
    throw new apiError(404, 'User not found');
  }

  res
    .status(200)
    .json(
      new apiResponse(200, 'User profile fetched successfully', userProfile[0])
    );
});

/**
 * Update user's profile information
 * @route PATCH /api/v1/users/update-profile
 * @access Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, email, username, bio } = req.body;

  // If username is being changed, check if new username is taken
  if (username && username !== req.user.username) {
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existingUser) {
      throw new apiError(409, 'Username is already taken');
    }
  }

  // If email is being changed, check if new email is taken
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new apiError(409, 'Email is already taken');
    }
  }

  // Update fields
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        ...(fullName && { fullName }),
        ...(email && { email: email.toLowerCase() }),
        ...(username && { username: username.toLowerCase() }),
        ...(bio !== undefined && { bio }), // Allow empty string for bio
      },
    },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  res
    .status(200)
    .json(new apiResponse(200, 'Profile updated successfully', updatedUser));
});

/**
 * Update user's avatar image
 * @route PATCH /api/v1/users/avatar
 * @access Private
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarPath = req.file?.path;

  if (!avatarPath) {
    throw new apiError(400, 'Avatar file is required');
  }

  // Optional: Get old avatar URL for cleanup
  const currentUser = await User.findById(req.user._id);
  const oldAvatarUrl = currentUser?.avatarUrl;

  const avatarUploadResult = await uploadOnCloudinary(avatarPath);
  if (!avatarUploadResult) {
    throw new apiError(500, 'Avatar upload failed');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatarUrl: avatarUploadResult.url } },
    { new: true }
  ).select('-password -refreshTokens');

  // Optional: Delete old image from Cloudinary
  if (oldAvatarUrl) await deleteFromCloudinary(oldAvatarUrl);

  res
    .status(200)
    .json(new apiResponse(200, 'Avatar updated successfully', user));
});

/**
 * Update user's cover image
 * @route PATCH /api/v1/users/cover-image
 * @access Private
 */
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverPath = req.file?.path;

  if (!coverPath) {
    throw new apiError(400, 'Cover image file is required');
  }

  try {
    // Get old cover URL for cleanup
    const currentUser = await User.findById(req.user._id);
    const oldCoverUrl = currentUser?.coverUrl;

    const coverUploadResult = await uploadOnCloudinary(coverPath);

    if (!coverUploadResult || !coverUploadResult.url) {
      throw new apiError(500, 'Cover image upload to cloud storage failed');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { coverUrl: coverUploadResult.url } },
      { new: true }
    ).select('-password -refreshTokens');

    // Delete old image from Cloudinary
    if (oldCoverUrl) {
      await deleteFromCloudinary(oldCoverUrl).catch((err) => {
        console.error('Failed to delete old cover:', err);
      });
    }

    res
      .status(200)
      .json(new apiResponse(200, 'Cover image updated successfully', user));
  } catch (error) {
    throw error;
  }
});

// ============================================
// CHANNEL & SOCIAL CONTROLLERS
// ============================================

/**
 * Get user's channel profile with subscription data
 * @route GET /api/v1/users/c/:username
 * @access Private
 */
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new apiError(400, 'Username is missing');
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: '_id',
        foreignField: 'owner',
        as: 'videos',
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: '$subscribers',
        },
        channelsSubscribedToCount: {
          $size: '$subscribedTo',
        },
        videosCount: {
          $size: '$videos',
        },
        isSubscribed: {
          $in: [req.user?._id, '$subscribers.subscriber'],
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatarUrl: 1,
        coverUrl: 1,
        bio: 1,
        createdAt: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        videosCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  if (!channel.length) {
    throw new apiError(404, 'Channel not found');
  }
  res
    .status(200)
    .json(
      new apiResponse(200, 'Channel profile retrieved successfully', channel[0])
    );
});

/**
 * Toggle subscription status for a channel
 * @route POST /api/v1/users/toggle-subscription/:channelId
 * @access Private
 */
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Validate channelId format
  if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw new apiError(400, 'Invalid channel ID');
  }

  // Check if channel exists
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new apiError(404, 'Channel not found');
  }

  // Prevent users from subscribing to their own channel
  if (channelId === req.user._id.toString()) {
    throw new apiError(400, 'You cannot subscribe to your own channel');
  }

  // Check if subscription already exists
  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existingSubscription) {
    // User is subscribed - unsubscribe them
    await Subscription.findByIdAndDelete(existingSubscription._id);

    // Get updated subscriber count
    const subscribersCount = await Subscription.countDocuments({
      channel: channelId,
    });

    res.status(200).json(
      new apiResponse(200, 'Successfully unsubscribed from channel', {
        isSubscribed: false,
        subscribersCount,
        action: 'unsubscribed',
      })
    );
  } else {
    // User is not subscribed - subscribe them
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });

    // Create notification for the channel owner
    try {
      await createNotificationAndEmit({
        recipient: channelId,
        type: 'subscription',
        title: 'New Subscriber',
        message: `${req.user.fullName} subscribed to your channel`,
        relatedUser: req.user._id,
      });
    } catch (notifError) {
      // Log the error but don't fail the subscription
      console.error('Failed to create subscription notification:', notifError);
    }

    // Get updated subscriber count
    const subscribersCount = await Subscription.countDocuments({
      channel: channelId,
    });

    res.status(200).json(
      new apiResponse(200, 'Successfully subscribed to channel', {
        isSubscribed: true,
        subscribersCount,
        action: 'subscribed',
      })
    );
  }
});

// ============================================
// CONTENT CONTROLLERS
// ============================================

/**
 * Get user's watch history with pagination
 * @route GET /api/v1/users/watch-history
 * @access Private
 */
const getUserWatchHistory = asyncHandler(async (req, res) => {
  // Get pagination parameters from query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 50) {
    throw new apiError(
      400,
      'Invalid pagination parameters. Page must be >= 1, limit must be 1-50'
    );
  }

  const skip = (page - 1) * limit;

  // Fetch paginated watch history directly from DB to avoid in-memory slicing for large histories
  const [watchHistoryResult] = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $project: {
        watchHistory: 1,
      },
    },
    {
      $unwind: {
        path: '$watchHistory',
        includeArrayIndex: 'watchIndex',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $sort: {
        watchIndex: -1,
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'video',
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatarUrl: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: '$owner',
              },
            },
          },
          {
            $project: {
              title: 1,
              description: 1,
              url: 1,
              thumbnailUrl: 1,
              duration: 1,
              views: 1,
              createdAt: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$video',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: '$video',
      },
    },
    {
      $facet: {
        videos: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ]);

  const paginatedVideos = watchHistoryResult?.videos || [];
  const totalVideos = watchHistoryResult?.totalCount?.[0]?.count || 0;
  const totalPages = Math.ceil(totalVideos / limit);

  res.status(200).json(
    new apiResponse(200, 'Watch history retrieved successfully', {
      videos: paginatedVideos,
      pagination: {
        currentPage: page,
        totalPages,
        totalVideos,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  );
});

// ============================================
// EXPORTS - Organized by Functionality
// ============================================
export {
  // Authentication Controllers
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,

  // Profile Management Controllers
  getCurrentUserProfile,
  updateUserProfile,
  updateUserAvatar,
  updateUserCoverImage,

  // Account Security Controllers
  changeCurrentUserPassword,

  // Channel & Social Controllers
  getUserChannelProfile,
  toggleSubscription,

  // Content Controllers
  getUserWatchHistory,
};
