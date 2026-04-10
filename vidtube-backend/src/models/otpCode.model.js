import mongoose, { Schema } from 'mongoose';

const otpCodeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Remove expired OTP documents automatically.
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpCodeSchema.index({ user: 1, purpose: 1, consumedAt: 1, createdAt: -1 });
otpCodeSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export const OtpCode = mongoose.model('OtpCode', otpCodeSchema);
