import { z } from 'zod';
import { objectIdRegex } from './common.validator.js';

/**
 * Comment Validation Schemas using Zod
 */

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be at most 1000 characters'),
  parent: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid parent comment id')
    .optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be at most 1000 characters'),
});

export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  sortBy: z.enum(['top', 'newest']).optional(),
});

export const commentRepliesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
