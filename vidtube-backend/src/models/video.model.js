import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema(
  {
    videoformat: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    url: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, default: '', trim: true },
    duration: { type: Number, required: true },
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Enhanced fields
    privacy: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public',
      index: true, // For filtering by privacy
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
      index: true, // For category-based filtering
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Cached counts for performance (updated via aggregation hooks or scheduled jobs)
    likesCount: {
      type: Number,
      default: 0,
      index: true, // For sorting by popularity
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    // Metadata
    metadata: {
      resolution: { type: String, default: '' },
      bitrate: { type: Number, default: 0 },
      fileSize: { type: Number, default: 0 }, // in bytes
    },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
// Index for: Get videos by owner (for channel pages) - owner + isPublished + createdAt
videoSchema.index({ owner: 1, isPublished: 1, createdAt: -1 });

// Index for: Get all published videos sorted by date (homepage)
videoSchema.index({ isPublished: 1, createdAt: -1 });

// Index for: Get all published videos sorted by views (trending)
videoSchema.index({ isPublished: 1, views: -1 });

// Index for: Privacy-based queries
videoSchema.index({ privacy: 1, isPublished: 1, createdAt: -1 });

// Index for: Category-based queries
videoSchema.index({ category: 1, isPublished: 1, createdAt: -1 });

// Index for: Tags-based queries
videoSchema.index({ tags: 1, isPublished: 1 });

// Index for: Likes count sorting (popularity)
videoSchema.index({ likesCount: -1 });

// Text index for search functionality (MongoDB allows only one text index per collection)
// This enables $text search queries on title and description
videoSchema.index({ title: 'text', description: 'text' });

// Individual indexes for regex-based search fallback (used in searchVideos controller)
// These are still useful for case-insensitive regex queries
videoSchema.index({ title: 1 });
videoSchema.index({ description: 1 });

// Index for timestamp sorting (backup for other sort operations)
videoSchema.index({ createdAt: -1 });

// Index for views sorting (trending queries)
videoSchema.index({ views: -1 });

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model('Video', videoSchema);

export default Video;