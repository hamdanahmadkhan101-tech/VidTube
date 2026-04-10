import { z } from 'zod';
import { objectIdRegex } from './common.validator.js';

const objectId = z.string().trim().regex(objectIdRegex, 'Invalid object id');

const reportTypeEnum = z.enum(['video', 'comment', 'user', 'channel']);
const reportReasonEnum = z.enum([
  'spam',
  'harassment',
  'hate_speech',
  'inappropriate_content',
  'copyright',
  'violence',
  'other',
]);
const reportStatusEnum = z.enum([
  'pending',
  'reviewing',
  'resolved',
  'dismissed',
]);

export const reportIdParamSchema = z.object({
  reportId: objectId,
});

export const createReportSchema = z.object({
  type: reportTypeEnum,
  reportedItem: objectId,
  reason: reportReasonEnum,
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .default(''),
});

export const reportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: reportStatusEnum.optional(),
  type: reportTypeEnum.optional(),
});

export const updateReportStatusSchema = z.object({
  status: reportStatusEnum,
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional(),
});
