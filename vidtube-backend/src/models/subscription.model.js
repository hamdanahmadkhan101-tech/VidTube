import mongoose, { Schema } from 'mongoose';

const SubscriptionSchema = new Schema(
  {
    subscriber: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channel: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;
