import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const likeSchema = new Schema(
  {
    video: { type: Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
    likedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

// Compound unique index: Prevent duplicate likes by the same user on the same video
// This also optimizes queries checking if a user liked a specific video
likeSchema.index({ video: 1, likedBy: 1 }, { unique: true });

// Index for: Get all likes for a video (for like count) - optimized aggregation
likeSchema.index({ video: 1, createdAt: -1 });

// Index for: Get all videos liked by a user (user's liked videos page)
likeSchema.index({ likedBy: 1, createdAt: -1 });

likeSchema.plugin(mongooseAggregatePaginate);

const Like = mongoose.model('Like', likeSchema);

export default Like;


