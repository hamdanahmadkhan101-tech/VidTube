import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index: Efficiently query comments per video by newest first
// This is the most common query pattern - get comments for a video, sorted by date
commentSchema.index({ video: 1, createdAt: -1 });

// Index for: Get all comments by a user (for user activity/profile)
commentSchema.index({ owner: 1, createdAt: -1 });

// Index for general timestamp sorting
commentSchema.index({ createdAt: -1 });

// Index for parent comments and replies
commentSchema.index({ parent: 1, createdAt: -1 });

commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
