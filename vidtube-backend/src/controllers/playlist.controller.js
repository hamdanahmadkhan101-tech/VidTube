// ============================================
// IMPORTS & DEPENDENCIES
// ============================================
import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../errors/index.js';
import {
  validateObjectId,
  validateRequired,
  validateStringLength,
} from '../utils/validation.js';

// Models
import Playlist from '../models/playlist.model.js';
import Video from '../models/video.model.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build owner lookup pipeline
 */
const ownerLookupPipeline = [
  {
    $lookup: {
      from: 'users',
      localField: 'owner',
      foreignField: '_id',
      as: 'owner',
      pipeline: [
        {
          $project: {
            username: 1,
            fullName: 1,
            avatarUrl: 1,
          },
        },
      ],
    },
  },
  {
    $addFields: {
      owner: { $first: '$owner' },
    },
  },
];

/**
 * Normalize pagination parameters
 */
const getPaginationParams = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  let limit = parseInt(query.limit, 10) || 10;
  if (limit > 50) limit = 50;
  if (limit < 1) limit = 1;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// ============================================
// PLAYLIST MANAGEMENT
// ============================================

/**
 * Create a new playlist
 * @route POST /api/v1/playlists
 * @access Private
 */
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description = '', isPublic = true } = req.body;

  // Validate required fields
  validateRequired({ name }, ['name']);

  // Validate string fields
  const validatedName = validateStringLength(name, 1, 100, 'name');
  const validatedDescription = description
    ? validateStringLength(description, 0, 500, 'description')
    : '';

  // Create new playlist
  const playlist = await Playlist.create({
    name: validatedName,
    description: validatedDescription,
    owner: req.user._id,
    isPublic,
    videos: [],
  });

  if (!playlist) {
    throw new apiError(500, 'Failed to create playlist');
  }

  // Populate owner info
  await playlist.populate({
    path: 'owner',
    select: 'username fullName avatarUrl',
  });

  const response = apiResponse(201, 'Playlist created successfully', playlist);

  res.status(201).json(response);
});

/**
 * Get all playlists for a user
 * @route GET /api/v1/playlists/user/:userId
 * @access Public (only public playlists), Private (all if owner)
 */
const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  validateObjectId(userId, 'userId');

  const { page, limit, skip } = getPaginationParams(req.query);

  // Build match stage based on authentication
  const matchStage = {
    owner: new mongoose.Types.ObjectId(userId),
  };

  // If not the owner, only show public playlists
  if (req.user?._id.toString() !== userId) {
    matchStage.isPublic = true;
  }

  const pipeline = [
    { $match: matchStage },
    ...ownerLookupPipeline,
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];

  const playlists = await Playlist.aggregate(pipeline);
  const totalCount = await Playlist.countDocuments(matchStage);

  const response = apiResponse(200, 'User playlists fetched successfully', {
    playlists,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    },
  });

  res.status(200).json(response);
});

/**
 * Get a single playlist by ID
 * @route GET /api/v1/playlists/:playlistId
 * @access Public (if public), Private (owner)
 */
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  validateObjectId(playlistId, 'playlistId');

  const playlist = await Playlist.findById(playlistId).populate({
    path: 'owner',
    select: 'username fullName avatarUrl',
  });

  if (!playlist) {
    throw new NotFoundError('Playlist not found');
  }

  // Check if user has access
  if (
    !playlist.isPublic &&
    req.user?._id.toString() !== playlist.owner._id.toString()
  ) {
    throw new ForbiddenError('You do not have access to this playlist');
  }

  const response = apiResponse(200, 'Playlist fetched successfully', playlist);

  res.status(200).json(response);
});

/**
 * Update a playlist
 * @route PATCH /api/v1/playlists/:playlistId
 * @access Private (owner only)
 */
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description, isPublic } = req.body;

  validateObjectId(playlistId, 'playlistId');

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new NotFoundError('Playlist not found');
  }

  // Check ownership
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only update your own playlists');
  }

  // Update fields
  if (name) {
    playlist.name = validateStringLength(name, 1, 100, 'name');
  }
  if (description !== undefined) {
    playlist.description = description
      ? validateStringLength(description, 0, 500, 'description')
      : '';
  }
  if (isPublic !== undefined) {
    playlist.isPublic = isPublic;
  }

  await playlist.save();

  const response = apiResponse(200, 'Playlist updated successfully', playlist);

  res.status(200).json(response);
});

/**
 * Delete a playlist
 * @route DELETE /api/v1/playlists/:playlistId
 * @access Private (owner only)
 */
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  validateObjectId(playlistId, 'playlistId');

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new NotFoundError('Playlist not found');
  }

  // Check ownership
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only delete your own playlists');
  }

  await Playlist.deleteOne({ _id: playlistId });

  const response = apiResponse(200, 'Playlist deleted successfully', null);

  res.status(200).json(response);
});

/**
 * Add a video to a playlist
 * @route POST /api/v1/playlists/:playlistId/videos/:videoId
 * @access Private (owner only)
 */
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  validateObjectId(playlistId, 'playlistId');
  validateObjectId(videoId, 'videoId');

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new NotFoundError('Playlist not found');
  }

  // Check ownership
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only modify your own playlists');
  }

  // Check if video exists and is published
  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) {
    throw new NotFoundError('Video not found or not published');
  }

  // Check if video already in playlist
  const videoExists = playlist.videos.some(
    (v) => v.video.toString() === videoId
  );

  if (videoExists) {
    throw new apiError(409, 'Video is already in this playlist');
  }

  // Add video to playlist
  playlist.videos.push({
    video: videoId,
    order: playlist.videos.length,
  });

  await playlist.save();
  await playlist.populate({
    path: 'videos.video',
    select: 'title thumbnailUrl duration',
  });

  const response = apiResponse(
    200,
    'Video added to playlist successfully',
    playlist
  );

  res.status(200).json(response);
});

/**
 * Remove a video from a playlist
 * @route DELETE /api/v1/playlists/:playlistId/videos/:videoId
 * @access Private (owner only)
 */
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  validateObjectId(playlistId, 'playlistId');
  validateObjectId(videoId, 'videoId');

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new NotFoundError('Playlist not found');
  }

  // Check ownership
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only modify your own playlists');
  }

  // Remove video
  playlist.videos = playlist.videos.filter(
    (v) => v.video.toString() !== videoId
  );

  await playlist.save();

  const response = apiResponse(
    200,
    'Video removed from playlist successfully',
    playlist
  );

  res.status(200).json(response);
});

// ============================================
// EXPORTS
// ============================================

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
};
