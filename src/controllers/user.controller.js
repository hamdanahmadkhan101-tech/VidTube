import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import apiResponse from '../utils/apiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

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

  const createdUser = await User
    .findById(newUser._id)
    .select('-password -refreshTokens');

  if (!createdUser) {
    throw new apiError(500, 'User registration failed');
  }

  res
    .status(201)
    .json(new apiResponse(201, 'User registered successfully', createdUser));
});

export { registerUser };
