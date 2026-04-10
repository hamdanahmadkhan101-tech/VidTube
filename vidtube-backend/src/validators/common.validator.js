import { z } from 'zod';

export const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const buildObjectIdParamSchema = (fieldName = 'id') =>
  z.object({
    [fieldName]: z.string().trim().regex(objectIdRegex, `Invalid ${fieldName}`),
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
