import { Link } from "react-router-dom";
import { Clock, Eye } from "lucide-react";
import LazyImage from "./LazyImage.jsx";
import { formatDuration, formatViews, formatRelativeTime } from "../../utils/formatters.js";

export default function VideoCard({ video }) {
  return (
    <Link
      to={`/video/${video._id}`}
      className="group flex flex-col cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
      aria-label={`Watch ${video.title} by ${video.owner?.fullName || video.owner?.username || 'Unknown'}`}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-surface rounded-lg overflow-hidden mb-3">
        {video.thumbnailUrl ? (
          <LazyImage
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-surface to-surface-light">
            <div className="text-textSecondary text-4xl">📹</div>
          </div>
        )}

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0" aria-hidden="true">
          {video.owner?.avatarUrl ? (
            <LazyImage
              src={video.owner.avatarUrl}
              alt={`${video.owner.fullName || video.owner.username}'s avatar`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold" aria-label="User avatar">
              {(video.owner?.fullName || video.owner?.username || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
        </div>

        {/* Title and metadata */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {video.title}
          </h3>
          <div className="flex flex-col gap-0.5 text-xs text-textSecondary">
            <span className="truncate">
              {video.owner?.fullName || video.owner?.username || "Unknown"}
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatViews(video.views)}
              </span>
              {video.createdAt && <span>• {formatRelativeTime(video.createdAt)}</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
