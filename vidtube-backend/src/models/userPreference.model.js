import mongoose, { Schema } from 'mongoose';

const userPreferenceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    privacy: {
      showEmail: {
        type: Boolean,
        default: false,
      },
      showWatchHistory: {
        type: Boolean,
        default: true,
      },
    },
    playback: {
      autoplay: {
        type: Boolean,
        default: true,
      },
      defaultQuality: {
        type: String,
        enum: ['auto', '1080p', '720p', '480p', '360p'],
        default: 'auto',
      },
    },
    ui: {
      compactMode: {
        type: Boolean,
        default: false,
      },
      rightSidebarMenu: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);

export default UserPreference;
