import { createHash, randomInt } from 'node:crypto';
import apiError from '../utils/apiError.js';
import { logWarn } from '../utils/logger.js';
import { OtpCode } from '../models/otpCode.model.js';
import { sendEmail } from './email.service.js';

export const OTP_PURPOSE = Object.freeze({
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
});

const toPositiveInt = (rawValue, fallback) => {
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const OTP_TTL_MINUTES = toPositiveInt(process.env.OTP_TTL_MINUTES, 10);
const OTP_MAX_ATTEMPTS = toPositiveInt(process.env.OTP_MAX_ATTEMPTS, 5);
const OTP_RESEND_COOLDOWN_SECONDS = toPositiveInt(
  process.env.OTP_RESEND_COOLDOWN_SECONDS,
  60
);
const OTP_DAILY_SEND_LIMIT = toPositiveInt(process.env.OTP_DAILY_SEND_LIMIT, 5);

const getHashPepper = () => process.env.OTP_HASH_PEPPER || 'dev-otp-pepper';

const getOtpExpiryDate = () =>
  new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

const hashOtp = (otp) =>
  createHash('sha256').update(`${otp}:${getHashPepper()}`).digest('hex');

const generateOtp = () => String(randomInt(0, 1000000)).padStart(6, '0');

const getDayStartUtc = () => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
};

const buildEmailTemplate = ({ purpose, otp }) => {
  const ttlText = `${OTP_TTL_MINUTES} minute${OTP_TTL_MINUTES > 1 ? 's' : ''}`;

  if (purpose === OTP_PURPOSE.PASSWORD_RESET) {
    return {
      subject: 'VidTube Password Reset OTP',
      html: `<p>Your VidTube password reset OTP is <strong>${otp}</strong>.</p><p>This code expires in ${ttlText}.</p><p>If you did not request a password reset, you can ignore this email.</p>`,
      text: `Your VidTube password reset OTP is ${otp}. This code expires in ${ttlText}.`,
    };
  }

  return {
    subject: 'VidTube Email Verification OTP',
    html: `<p>Welcome to VidTube.</p><p>Your email verification OTP is <strong>${otp}</strong>.</p><p>This code expires in ${ttlText}.</p>`,
    text: `Your VidTube email verification OTP is ${otp}. This code expires in ${ttlText}.`,
  };
};

const ensureSendAllowed = async ({ userId, email, purpose }) => {
  const now = new Date();

  const latestCode = await OtpCode.findOne({
    user: userId,
    purpose,
    consumedAt: null,
  })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();

  if (latestCode?.createdAt) {
    const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
    const elapsedMs = now.getTime() - new Date(latestCode.createdAt).getTime();

    if (elapsedMs < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
      throw new apiError(
        429,
        `Please wait ${waitSeconds}s before requesting another OTP`
      );
    }
  }

  const dailyCount = await OtpCode.countDocuments({
    email,
    purpose,
    createdAt: { $gte: getDayStartUtc() },
  });

  if (dailyCount >= OTP_DAILY_SEND_LIMIT) {
    throw new apiError(
      429,
      'Daily OTP send limit reached. Please try again tomorrow.'
    );
  }
};

export const issueOtp = async ({ userId, email, fullName, purpose }) => {
  const normalizedEmail = String(email || '')
    .toLowerCase()
    .trim();

  if (!userId || !normalizedEmail || !purpose) {
    throw new apiError(400, 'Cannot issue OTP due to missing details');
  }

  await ensureSendAllowed({
    userId,
    email: normalizedEmail,
    purpose,
  });

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = getOtpExpiryDate();

  await OtpCode.deleteMany({
    user: userId,
    purpose,
    consumedAt: null,
  });

  await OtpCode.create({
    user: userId,
    email: normalizedEmail,
    purpose,
    otpHash,
    expiresAt,
    attempts: 0,
  });

  const template = buildEmailTemplate({ purpose, otp });
  const emailResult = await sendEmail({
    to: normalizedEmail,
    toName: fullName,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
  });

  if (emailResult.skipped) {
    if (process.env.NODE_ENV === 'production') {
      throw new apiError(503, 'Email service is not configured');
    }

    logWarn('OTP email skipped because provider is not configured', {
      reason: emailResult.reason,
      purpose,
      email: normalizedEmail,
    });
  }

  return {
    expiresAt,
    skipped: Boolean(emailResult.skipped),
  };
};

export const verifyOtp = async ({ userId, purpose, otp }) => {
  const otpValue = String(otp || '').trim();

  if (!userId || !purpose || !otpValue) {
    throw new apiError(400, 'Invalid OTP verification request');
  }

  const otpDoc = await OtpCode.findOne({
    user: userId,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    throw new apiError(400, 'Invalid or expired OTP');
  }

  if (otpDoc.attempts >= OTP_MAX_ATTEMPTS) {
    throw new apiError(429, 'Maximum OTP verification attempts exceeded');
  }

  const incomingHash = hashOtp(otpValue);
  if (incomingHash !== otpDoc.otpHash) {
    otpDoc.attempts += 1;
    await otpDoc.save({ validateBeforeSave: false });
    throw new apiError(400, 'Invalid or expired OTP');
  }

  otpDoc.consumedAt = new Date();
  otpDoc.attempts += 1;
  await otpDoc.save({ validateBeforeSave: false });

  return true;
};
