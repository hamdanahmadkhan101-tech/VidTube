import mongoose, { Schema } from 'mongoose';

const SubscriptionSchema = new Schema(
  {
    subscriber: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index: Prevent duplicate subscriptions
// This ensures a user can only subscribe to a channel once
SubscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

// Index for: Get all subscribers of a channel (for subscriber count/lists)
SubscriptionSchema.index({ channel: 1, subscribedAt: -1 });

// Index for: Get all channels a user is subscribed to (subscription feed)
SubscriptionSchema.index({ subscriber: 1, subscribedAt: -1 });

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;
