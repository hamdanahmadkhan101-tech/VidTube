import mongoose, { Schema } from 'mongoose';

const idempotencyKeySchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    method: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    route: {
      type: String,
      required: true,
      trim: true,
      maxlength: 256,
    },
    scope: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    requestHash: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    status: {
      type: String,
      enum: ['processing', 'completed'],
      default: 'processing',
      required: true,
    },
    responseStatusCode: {
      type: Number,
      default: null,
    },
    responseBody: {
      type: Schema.Types.Mixed,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

idempotencyKeySchema.index(
  { key: 1, method: 1, route: 1, scope: 1 },
  { unique: true }
);
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
idempotencyKeySchema.index({ status: 1, updatedAt: -1 });

const IdempotencyKey = mongoose.model('IdempotencyKey', idempotencyKeySchema);

export default IdempotencyKey;
