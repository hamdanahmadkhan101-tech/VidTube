import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000, // Changed from maxlength to maxLength
    },
    video: { type: Schema.Types.ObjectId, ref: 'Video', required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Efficiently query comments per video by newest first
commentSchema.index({ video: 1, createdAt: -1 });

commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;


