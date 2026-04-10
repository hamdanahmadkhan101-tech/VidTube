import mongoose, { Schema } from 'mongoose';

const watchLaterEntrySchema = new Schema(
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
    savedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    source: {
      type: String,
      enum: ['watch-page', 'shorts-feed', 'search', 'channel', 'manual'],
      default: 'watch-page',
    },
  },
  { timestamps: true }
);

watchLaterEntrySchema.index({ user: 1, video: 1 }, { unique: true });
watchLaterEntrySchema.index({ user: 1, savedAt: -1 });
watchLaterEntrySchema.index({ video: 1, savedAt: -1 });

const WatchLaterEntry = mongoose.model(
  'WatchLaterEntry',
  watchLaterEntrySchema
);

export default WatchLaterEntry;
