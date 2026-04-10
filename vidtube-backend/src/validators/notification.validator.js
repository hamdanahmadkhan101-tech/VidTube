import { z } from 'zod';
import { objectIdRegex } from './common.validator.js';

export const notificationIdParamSchema = z.object({
  notificationId: z
    .string()
    .trim()
    .regex(objectIdRegex, 'Invalid notificationId'),
});

export const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
});
