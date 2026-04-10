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
const APP_NAME = process.env.APP_NAME || 'VidTube';
const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || process.env.MAIL_FROM_EMAIL || '';

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

const buildOtpEmailHtml = ({ heading, intro, otp, ttlText, safetyNote }) => {
  const supportRow = SUPPORT_EMAIL
    ? `<p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #7c3aed; text-decoration: none;">${SUPPORT_EMAIL}</a>.</p>`
    : '';

  return `
  <div style="margin: 0; padding: 24px; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 20px 24px; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">${APP_NAME}</h1>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Secure account communication</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px; color: #111827;">
          <h2 style="margin: 0 0 10px; font-size: 20px;">${heading}</h2>
          <p style="margin: 0 0 16px; color: #4b5563; font-size: 14px; line-height: 1.6;">${intro}</p>

          <div style="margin: 0 0 16px; padding: 14px; border: 1px dashed #d1d5db; border-radius: 10px; background: #fafafa; text-align: center;">
            <p style="margin: 0 0 6px; font-size: 12px; color: #6b7280; letter-spacing: 0.04em; text-transform: uppercase;">One-time passcode</p>
            <p style="margin: 0; font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #111827;">${otp}</p>
          </div>

          <p style="margin: 0 0 10px; color: #4b5563; font-size: 14px;">This code expires in <strong>${ttlText}</strong>.</p>
          <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">${safetyNote}</p>
          ${supportRow}
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
          This is an automated message from ${APP_NAME}. Please do not reply to this email.
        </td>
      </tr>
    </table>
  </div>`;
};

const buildEmailTemplate = ({ purpose, otp }) => {
  const ttlText = `${OTP_TTL_MINUTES} minute${OTP_TTL_MINUTES > 1 ? 's' : ''}`;

  if (purpose === OTP_PURPOSE.PASSWORD_RESET) {
    return {
      subject: `${APP_NAME} Password Reset OTP`,
      html: buildOtpEmailHtml({
        heading: 'Reset your password',
        intro:
          'Use the one-time passcode below to reset your password securely.',
        otp,
        ttlText,
        safetyNote:
          'If you did not request a password reset, you can safely ignore this message.',
      }),
      text: `${APP_NAME} password reset code: ${otp}\n\nThis code expires in ${ttlText}.\n\nIf you did not request a password reset, you can ignore this email.`,
    };
  }

  return {
    subject: `${APP_NAME} Email Verification OTP`,
    html: buildOtpEmailHtml({
      heading: 'Verify your email address',
      intro:
        'Welcome to VidTube. Enter the following one-time passcode to verify your email address.',
      otp,
      ttlText,
      safetyNote:
        'Never share this code with anyone. Our team will never ask for your OTP.',
    }),
    text: `${APP_NAME} email verification code: ${otp}\n\nThis code expires in ${ttlText}.\n\nDo not share this code with anyone.`,
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
  let emailResult;

  try {
    emailResult = await sendEmail({
      to: normalizedEmail,
      toName: fullName,
      subject: template.subject,
      htmlContent: template.html,
      textContent: template.text,
    });
  } catch (error) {
    await OtpCode.deleteMany({
      user: userId,
      purpose,
      consumedAt: null,
    });

    throw error;
  }

  if (emailResult.skipped) {
    if (process.env.NODE_ENV === 'production') {
      await OtpCode.deleteMany({
        user: userId,
        purpose,
        consumedAt: null,
      });

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
