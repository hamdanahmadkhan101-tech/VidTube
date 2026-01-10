import { Link } from 'react-router-dom';
import { Video, Search, Inbox, Upload } from 'lucide-react';
import Button from '../ui/Button.jsx';

/**
 * Empty State Components
 * Reusable empty state displays for better UX
 */

export function EmptyState({
  icon: Icon = Video,
  title,
  message,
  actionLabel,
  actionPath,
  actionOnClick,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 p-4 rounded-full bg-surface inline-flex">
        <Icon className="h-8 w-8 text-textSecondary" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-textSecondary max-w-md mb-6">{message}</p>
      {actionLabel && (
        <>
          {actionPath ? (
            <Link to={actionPath}>
              <Button>{actionLabel}</Button>
            </Link>
          ) : (
            actionOnClick && (
              <Button onClick={actionOnClick}>{actionLabel}</Button>
            )
          )}
        </>
      )}
    </div>
  );
}

export function EmptyVideoList({ message = 'No videos found', showUpload = false }) {
  return (
    <EmptyState
      icon={Video}
      title="No Videos"
      message={message}
      actionLabel={showUpload ? 'Upload Your First Video' : undefined}
      actionPath={showUpload ? '/upload' : undefined}
    />
  );
}

export function EmptySearchResults({ query }) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      message={`We couldn't find any videos matching "${query}". Try different keywords or browse trending videos.`}
      actionLabel="Browse Trending"
      actionPath="/?sortBy=views"
    />
  );
}

export function EmptyWatchHistory() {
  return (
    <EmptyState
      icon={Video}
      title="No Watch History"
      message="Videos you watch will appear here. Start exploring to build your watch history!"
      actionLabel="Explore Videos"
      actionPath="/"
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Inbox}
      title="No Notifications"
      message="You're all caught up! New notifications will appear here."
    />
  );
}

export function EmptyLikedVideos() {
  return (
    <EmptyState
      icon={Video}
      title="No Liked Videos"
      message="Videos you like will be saved here. Start liking videos to see them here!"
      actionLabel="Discover Videos"
      actionPath="/"
    />
  );
}

export function EmptyChannelVideos({ isOwnChannel = false }) {
  return (
    <EmptyState
      icon={Video}
      title={isOwnChannel ? 'No Videos Yet' : 'No Videos'}
      message={
        isOwnChannel
          ? "You haven't uploaded any videos yet. Share your first video with the world!"
          : 'This channel has no videos yet.'
      }
      actionLabel={isOwnChannel ? 'Upload Your First Video' : undefined}
      actionPath={isOwnChannel ? '/upload' : undefined}
    />
  );
}
