import mongoose, { Schema } from 'mongoose';

const reportSchema = new Schema(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['video', 'comment', 'user', 'channel'],
      index: true,
    },
    reportedItem: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'spam',
        'harassment',
        'hate_speech',
        'inappropriate_content',
        'copyright',
        'violence',
        'other',
      ],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    resolution: {
      type: String,
      trim: true,
      maxLength: 500,
    },
  },
  { timestamps: true }
);

// Indexes
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ type: 1, status: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1, createdAt: -1 });
// Prevent duplicate reports from same user for same item
reportSchema.index({ reportedBy: 1, type: 1, reportedItem: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;
