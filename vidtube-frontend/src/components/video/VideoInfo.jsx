import { Eye, Calendar, ThumbsUp, MessageCircle } from 'lucide-react';

/**
 * Video Info Component
 * Displays video metadata (title, views, date, likes, comments)
 */
export default function VideoInfo({ video, onLikeChange }) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatViews = (views) => {
    if (!views) return '0';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
      <div className="flex flex-wrap items-center gap-4 text-sm text-textSecondary">
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {formatViews(video.views)} views
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formatDate(video.createdAt)}
        </span>
        {video.likesCount !== undefined && (
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            {formatViews(video.likesCount)} likes
          </span>
        )}
        {video.commentsCount !== undefined && (
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {formatViews(video.commentsCount)} comments
          </span>
        )}
      </div>
    </div>
  );
}
