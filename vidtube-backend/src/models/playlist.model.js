import mongoose, { Schema } from 'mongoose';

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxLength: 500,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    videos: [
      {
        video: {
          type: Schema.Types.ObjectId,
          ref: 'Video',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Indexes
playlistSchema.index({ owner: 1, createdAt: -1 });
playlistSchema.index({ isPublic: 1, createdAt: -1 });
playlistSchema.index({ name: 'text', description: 'text' }); // Text search

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
