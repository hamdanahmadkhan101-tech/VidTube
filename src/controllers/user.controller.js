import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import apiResponse from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';

const generateAcessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new apiError(404, 'User not found');
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, 'Token generation failed');
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  // console.log(req.body);

  if (!fullName || !username || !email || !password) {
    throw new apiError(400, 'All fields are required');
  }

  const checkUser = await User.findOne({ $or: [{ email }, { username }] });
  if (checkUser) {
    const field = checkUser.email === email ? 'email' : 'username';
    throw new apiError(409, `User with this ${field} already exists`);
  }

  const avatarPath = req.files?.avatar?.[0]?.path ?? null;
  const coverPath = req.files?.coverImage?.[0]?.path ?? null;
  // console.log(req.files);

  if (!avatarPath) {
    throw new apiError(400, 'Avatar image is required');
  }

  const avatarUploadResult = await uploadOnCloudinary(avatarPath);
  const coverUploadResult = await uploadOnCloudinary(coverPath);

  if (!avatarUploadResult) {
    throw new apiError(500, 'Avatar upload failed');
  }

  const newUser = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatarUrl: avatarUploadResult.url,
    coverUrl: coverUploadResult?.url || null,
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

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  console.log(req.body);

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

  const user = await User.findOne({
    $or: [{ email: email }, { username: username }],
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

  const options = { httpOnly: true, secure: true, sameSite: 'None' };
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

const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (refreshToken) {
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { refreshTokens: refreshToken } },
      { new: true }
    );
  }

  const options = { httpOnly: true, secure: true, sameSite: 'None' };
  res
    .status(200)
    .clearCookie('refreshToken', options)
    .json(new apiResponse(200, 'User logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

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

  const options = { httpOnly: true, secure: true, sameSite: 'None' };

  return res
    .status(200)
    .cookie('refreshToken', newRefreshToken, options)
    .json(
      new apiResponse(200, 'Access token refreshed', {
        accessToken,
        refreshToken: newRefreshToken,
      })
    );
});

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

const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    '-password -refreshTokens'
  );
  if (!user) {
    throw new apiError(404, 'User not found');
  }

  res
    .status(200)
    .json(new apiResponse(200, 'User profile fetched successfully', user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new apiError(
      400,
      'At least one field (fullName or email) is required'
    );
  }

  // Check if email is being updated and if it's already taken
  if (email) {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user._id },
    });
    if (existingUser) {
      throw new apiError(409, 'Email is already taken');
    }
  }

  const updateFields = {};
  if (fullName) updateFields.fullName = fullName;
  if (email) updateFields.email = email;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true }
  ).select('-password -refreshTokens');

  res
    .status(200)
    .json(new apiResponse(200, 'Account details updated successfully', user));
});

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


const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverPath = req.file?.path;

  if (!coverPath) {
    throw new apiError(400, 'Cover image file is required');
  }

  // Get old cover URL for cleanup
  const currentUser = await User.findById(req.user._id);
  const oldCoverUrl = currentUser?.coverUrl;

  const coverUploadResult = await uploadOnCloudinary(coverPath);
  if (!coverUploadResult) {
    throw new apiError(500, 'Cover image upload failed');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverUrl: coverUploadResult.url } },
    { new: true }
  ).select('-password -refreshTokens');

  // Delete old image from Cloudinary
  if (oldCoverUrl) await deleteFromCloudinary(oldCoverUrl);

  res
    .status(200)
    .json(new apiResponse(200, 'Cover image updated successfully', user));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUserProfile,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
