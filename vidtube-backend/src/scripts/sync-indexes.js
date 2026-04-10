import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../db/dbconnect.js';

import { User } from '../models/user.model.js';
import Video from '../models/video.model.js';
import Comment from '../models/comment.model.js';
import Like from '../models/like.model.js';
import Notification from '../models/notification.model.js';
import Playlist from '../models/playlist.model.js';
import Report from '../models/report.model.js';
import Subscription from '../models/subscription.model.js';
import { OtpCode } from '../models/otpCode.model.js';
import IdempotencyKey from '../models/idempotencyKey.model.js';

const models = [
  User,
  Video,
  Comment,
  Like,
  Notification,
  Playlist,
  Report,
  Subscription,
  OtpCode,
  IdempotencyKey,
];

const run = async () => {
  try {
    await connectDB();

    for (const model of models) {
      const result = await model.syncIndexes();
      console.log(`Synced indexes for ${model.modelName}:`, result);
    }

    console.log('Index synchronization completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Index synchronization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
};

run();
