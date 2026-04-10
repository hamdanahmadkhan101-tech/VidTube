import { z } from 'zod';
import { objectIdRegex } from './common.validator.js';

const parseBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

const objectId = z.string().trim().regex(objectIdRegex, 'Invalid object id');

export const userIdParamSchema = z.object({
  userId: objectId,
});

export const playlistIdParamSchema = z.object({
  playlistId: objectId,
});

export const playlistVideoParamsSchema = z.object({
  playlistId: objectId,
  videoId: objectId,
});

export const createPlaylistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Playlist name is required')
    .max(100, 'Playlist name must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .default(''),
  isPublic: parseBoolean.optional().default(true),
});

export const updatePlaylistSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Playlist name cannot be empty')
      .max(100, 'Playlist name must be at most 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be at most 500 characters')
      .optional(),
    isPublic: parseBoolean.optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.isPublic !== undefined,
    {
      message: 'At least one playlist field must be provided',
      path: ['name'],
    }
  );
