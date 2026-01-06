import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const likeSchema = new Schema(
  {
    video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
    likedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Prevent duplicate likes by the same user on the same video
likeSchema.index({ video: 1, likedBy: 1 }, { unique: true });

likeSchema.plugin(mongooseAggregatePaginate);

const Like = mongoose.model('Like', likeSchema);

export default Like;


