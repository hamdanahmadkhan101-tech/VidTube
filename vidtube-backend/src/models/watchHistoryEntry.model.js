import mongoose, { Schema } from 'mongoose';

const watchHistoryEntrySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    firstWatchedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    watchCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    progressSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ['watch-page', 'autoplay', 'search', 'channel', 'external'],
      default: 'watch-page',
    },
  },
  { timestamps: true }
);

watchHistoryEntrySchema.index({ user: 1, video: 1 }, { unique: true });
watchHistoryEntrySchema.index({ user: 1, lastWatchedAt: -1 });
watchHistoryEntrySchema.index({ user: 1, completed: 1, lastWatchedAt: -1 });
watchHistoryEntrySchema.index({ video: 1, lastWatchedAt: -1 });

const WatchHistoryEntry = mongoose.model(
  'WatchHistoryEntry',
  watchHistoryEntrySchema
);

export default WatchHistoryEntry;
