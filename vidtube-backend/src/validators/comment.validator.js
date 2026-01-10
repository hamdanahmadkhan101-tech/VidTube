import { z } from 'zod';

/**
 * Comment Validation Schemas using Zod
 */

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be at most 1000 characters'),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be at most 1000 characters'),
});

// Type inference exports
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
