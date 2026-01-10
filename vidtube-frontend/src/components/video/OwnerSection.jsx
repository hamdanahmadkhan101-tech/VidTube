import { Link } from 'react-router-dom';
import SubscribeButton from '../social/SubscribeButton.jsx';

/**
 * Owner Section Component
 * Displays video owner information and subscription button
 */
export default function OwnerSection({ video, isOwner }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-border">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link
          to={`/channel/${video.owner?.username || video.owner?._id}`}
          className="shrink-0"
          aria-label={`Visit ${video.owner?.fullName || video.owner?.username}'s channel`}
        >
          {video.owner?.avatarUrl ? (
            <img
              src={video.owner.avatarUrl}
              alt={video.owner.fullName || video.owner.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
              {(video.owner?.fullName || video.owner?.username || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            to={`/channel/${video.owner?.username || video.owner?._id}`}
            className="block font-semibold text-white hover:text-primary transition-colors"
          >
            {video.owner?.fullName || video.owner?.username || 'Unknown'}
          </Link>
          <p className="text-sm text-textSecondary">Video Creator</p>
        </div>
      </div>
      {!isOwner && video.owner?._id && (
        <SubscribeButton
          channelId={video.owner._id}
          channelUsername={video.owner?.username}
          initialIsSubscribed={false}
          initialSubscribersCount={0}
        />
      )}
    </div>
  );
}
