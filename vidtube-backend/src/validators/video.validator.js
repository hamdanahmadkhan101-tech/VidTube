import { z } from 'zod';

/**
 * Video Validation Schemas using Zod
 * Better TypeScript support and type inference
 */

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
  duration: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number',
    })
    .positive('Duration must be a positive number')
    .max(86400, 'Duration cannot exceed 24 hours (86400 seconds)'),
});

export const videoUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),
});

export const videoSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be at most 100 characters'),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  sortBy: z.enum(['createdAt', 'views', 'title']).optional(),
  sortType: z.enum(['asc', 'desc']).optional(),
});

// Type inference exports for TypeScript (if used)
export type VideoUploadInput = z.infer<typeof videoUploadSchema>;
export type VideoUpdateInput = z.infer<typeof videoUpdateSchema>;
export type VideoSearchInput = z.infer<typeof videoSearchSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
