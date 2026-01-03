import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import apiResponse from '../utils/apiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
  // Registration logic here
  const { fullName, username, email, password } = req.body;

  if (!fullName || !username || !email || !password) {
    throw new apiError('All fields are required', 400);
  }

  const checkUser = await User.findOne({ $or: [{ email }, { username }] });
  if (checkUser) {
    const field = checkUser.email === email ? 'email' : 'username';
    throw new apiError(`User with this ${field} already exists`, 409);
  }

  const avatarPath = req.files?.avatarImage?.[0]?.path ?? null;
  const coverPath = req.files?.coverImage?.[0]?.path ?? null;

  if (!avatarPath) {
    throw new apiError('Avatar image is required', 400);
  }

  const avatarUploadResult = await uploadOnCloudinary(avatarPath);
  const coverUploadResult = await uploadOnCloudinary(coverPath);

  if (!avatarUploadResult) {
    throw new apiError('Avatar upload failed', 500);
  }

  const newUser = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatarUrl: avatarUploadResult.url,
    coverUrl: coverUploadResult?.url || null,
  });

  const createdUser = await newUser
    .findById(newUser._id)
    .select('-password -refreshTokens');

  if (!createdUser) {
    throw new apiError('User registration failed', 500);
  }

  res
    .status(201)
    .json(new apiResponse(201, 'User registered successfully', createdUser));
});

export { registerUser };
