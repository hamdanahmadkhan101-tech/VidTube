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
  duration: z.coerce
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

export const videoSearchSchema = z
  .object({
    query: z
      .string()
      .trim()
      .min(1, 'Search query is required')
      .max(100, 'Search query must be at most 100 characters')
      .optional(),
    q: z
      .string()
      .trim()
      .min(1, 'Search query is required')
      .max(100, 'Search query must be at most 100 characters')
      .optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .refine((data) => Boolean(data.query || data.q), {
    message: 'Search query is required',
    path: ['query'],
  });

export const videoSuggestionsSchema = z.object({
  query: z
    .string()
    .trim()
    .max(100, 'Suggestion query must be at most 100 characters')
    .optional(),
});

export const shortsFeedQuerySchema = z.object({
  cursor: z.string().trim().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
  category: z.string().trim().max(50).optional(),
});

export const videoListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  sortBy: z.enum(['createdAt', 'views', 'title', 'trending']).optional(),
  sortType: z.enum(['asc', 'desc']).optional(),
});

const watchProgressSourceSchema = z.enum([
  'watch-page',
  'autoplay',
  'search',
  'channel',
  'external',
  'shorts-feed',
]);

export const videoWatchProgressSchema = z.object({
  progressSeconds: z.coerce
    .number({
      required_error: 'progressSeconds is required',
      invalid_type_error: 'progressSeconds must be a number',
    })
    .min(0, 'progressSeconds must be greater than or equal to 0')
    .max(86400, 'progressSeconds cannot exceed 24 hours (86400 seconds)'),
  completed: z.boolean().optional(),
  source: watchProgressSourceSchema.optional(),
});

export const videoWatchEventSchema = z.object({
  source: watchProgressSourceSchema.optional(),
});

export const videoWatchProgressBatchSchema = z.object({
  events: z
    .array(
      z.object({
        videoId: z
          .string()
          .trim()
          .regex(/^[a-fA-F0-9]{24}$/, 'Invalid videoId'),
        progressSeconds: z.coerce
          .number({
            required_error: 'progressSeconds is required',
            invalid_type_error: 'progressSeconds must be a number',
          })
          .min(0, 'progressSeconds must be greater than or equal to 0')
          .max(86400, 'progressSeconds cannot exceed 24 hours (86400 seconds)'),
        completed: z.boolean().optional(),
        source: watchProgressSourceSchema.optional(),
      })
    )
    .min(1, 'At least one progress event is required')
    .max(20, 'A maximum of 20 progress events can be processed per batch'),
});
