import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
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
  await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { refreshTokens: req.cookies.refreshToken } },
    { new: true }
  );

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

  if (
    incomingRefreshToken !==
    user?.refreshTokens?.find((token) => token === incomingRefreshToken)
  ) {
    throw new apiError(401, 'Refresh token is expired or used');
  }

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

export { registerUser, loginUser, logoutUser, refreshAccessToken };
