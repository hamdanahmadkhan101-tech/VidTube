import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DEFAULT_AVATAR_URL } from '../utils/avatar.js';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, required: true, trim: true },
    password: { type: String, required: [true, 'Password is required'] },
    avatarUrl: { type: String, required: true, default: DEFAULT_AVATAR_URL },
    coverUrl: { type: String, default: '' },
    bio: { type: String, default: '', trim: true },
    socialLinks: {
      facebook: { type: String, default: '', trim: true },
      twitter: { type: String, default: '', trim: true },
      instagram: { type: String, default: '', trim: true },
      linkedin: { type: String, default: '', trim: true },
    },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    refreshTokens: [{ type: String }],
    // Enhanced fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    bannedUntil: {
      type: Date,
      default: null, // Temporary ban expiration
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      privacy: {
        showEmail: { type: Boolean, default: false },
        showWatchHistory: { type: Boolean, default: true },
      },
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    },
    statistics: {
      totalVideos: { type: Number, default: 0 },
      totalViews: { type: Number, default: 0 },
      totalLikes: { type: Number, default: 0 },
      totalSubscribers: { type: Number, default: 0 },
      lastActive: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

// Note: username and email are already indexed via unique constraints.

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model('User', userSchema);
