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
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  { timestamps: true }
);

// Query: fetch top-level video comments and order by recency.
commentSchema.index({ video: 1, parent: 1, createdAt: -1 });

// Query: fetch replies for a parent comment ordered oldest-first.
commentSchema.index({ parent: 1, createdAt: 1 });

// Query: anti-spam duplicate check in a short time window.
commentSchema.index({ owner: 1, video: 1, parent: 1, createdAt: -1 });

commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
