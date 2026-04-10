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
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
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

// Index for: Published videos sorted alphabetically by title
videoSchema.index({ isPublished: 1, title: 1 });

// Weighted text index for relevance-first search queries.
videoSchema.index(
  { title: 'text', description: 'text' },
  {
    weights: {
      title: 10,
      description: 4,
    },
    name: 'video_text_search',
  }
);

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model('Video', videoSchema);

export default Video;
