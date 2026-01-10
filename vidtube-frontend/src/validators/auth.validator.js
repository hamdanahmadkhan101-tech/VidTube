import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Frontend Validation Schemas using Zod
 * Matches backend validation for consistency
 */

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Email or username is required')
    .refine(
      (val) => {
        // Allow email format or username (alphanumeric + underscore)
        return (
          z.string().email().safeParse(val).success ||
          /^[a-zA-Z0-9_]+$/.test(val)
        );
      },
      {
        message: 'Please enter a valid email or username',
      }
    ),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
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
      .max(20, 'Username must be at most 20 characters')
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
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const videoUploadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be at most 5000 characters')
    .optional()
    .default(''),
  videoformat: z
    .string()
    .trim()
    .min(1, 'Video format is required')
    .max(20, 'Video format must be at most 20 characters'),
  duration: z.coerce
    .number()
    .positive('Duration must be a positive number')
    .max(86400, 'Duration cannot exceed 24 hours'),
});

// React Hook Form resolvers
export const loginResolver = zodResolver(loginSchema);
export const registerResolver = zodResolver(registerSchema);
export const videoUploadResolver = zodResolver(videoUploadSchema);

// Type exports (JSDoc comments for TypeScript-like types)
// LoginInput = z.infer<typeof loginSchema>
// RegisterInput = z.infer<typeof registerSchema>
// VideoUploadInput = z.infer<typeof videoUploadSchema>
