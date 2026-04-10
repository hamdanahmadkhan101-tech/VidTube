import mongoose, { Schema } from 'mongoose';

const userStatisticSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalVideos: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSubscribers: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVideosWatched: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWatchTimeSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
userStatisticSchema.index({ totalViews: -1 });

const UserStatistic = mongoose.model('UserStatistic', userStatisticSchema);

export default UserStatistic;
