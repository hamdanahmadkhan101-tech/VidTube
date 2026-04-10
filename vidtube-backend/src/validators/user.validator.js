import { z } from 'zod';

/**
 * User Validation Schemas using Zod
 */

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  email: z
    .string()
    .email('Please provide a valid email address')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address')
      .optional(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      )
      .optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => data.email || data.username, {
    message: 'Please provide either email or username to login',
    path: ['email'],
  });

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'OTP must be a 6-digit code');

export const verifyEmailOtpSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .trim()
    .toLowerCase(),
  otp: otpCodeSchema,
});

export const resendVerificationOtpSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .trim()
    .toLowerCase(),
});

export const requestPasswordResetOtpSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .trim()
    .toLowerCase(),
});

export const resetPasswordWithOtpSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .trim()
    .toLowerCase(),
  otp: otpCodeSchema,
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must be at most 128 characters'),
});

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be at most 100 characters')
      .optional(),
    email: z
      .string()
      .email('Please provide a valid email address')
      .trim()
      .toLowerCase()
      .optional(),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores'
      )
      .optional(),
    bio: z
      .string()
      .trim()
      .max(500, 'Bio must be at most 500 characters')
      .optional(),
    socialLinks: z
      .object({
        facebook: z.string().url().or(z.literal('')).optional(),
        twitter: z.string().url().or(z.literal('')).optional(),
        instagram: z.string().url().or(z.literal('')).optional(),
        linkedin: z.string().url().or(z.literal('')).optional(),
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.fullName !== undefined ||
      data.email !== undefined ||
      data.username !== undefined ||
      data.bio !== undefined ||
      data.socialLinks !== undefined,
    {
      message: 'At least one profile field must be provided',
      path: ['fullName'],
    }
  );

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password must be at most 128 characters'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const usernameAvailabilityParamSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
});

export const emailAvailabilityParamSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
});
