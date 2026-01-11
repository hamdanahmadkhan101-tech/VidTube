import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, Eye, ThumbsUp, MoreVertical } from "lucide-react";
import {
  cn,
  formatDuration,
  formatViewCount,
  formatRelativeTime,
} from "../../utils/helpers";
import type { Video } from "../../types";

interface VideoCardProps {
  video: Video;
  className?: string;
  showChannel?: boolean;
}

const VideoCardComponent: React.FC<VideoCardProps> = ({
  video,
  className,
  showChannel = true,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn("bento-item group cursor-pointer", className)}
    >
      <Link to={`/watch/${video._id}`} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-t-2xl">
          <img
            src={video.thumbnailUrl || "/default-thumbnail.jpg"}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-md text-xs font-semibold text-white">
            {formatDuration(video.duration)}
          </div>

          {/* Play Overlay on Hover */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              whileHover={{ scale: 1 }}
              className="w-14 h-14 rounded-full bg-primary-500/90 flex items-center justify-center shadow-glow"
            >
              <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
            </motion.div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            {/* Channel Avatar */}
            {showChannel && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/channel/${video.owner.username}`;
                }}
                className="flex-shrink-0 cursor-pointer"
              >
                <img
                  src={video.owner.avatarUrl || "/default-avatar.jpg"}
                  alt={video.owner.username}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-primary-500/20 hover:ring-primary-500/50 transition-all"
                />
              </div>
            )}

            {/* Video Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-text-primary font-semibold line-clamp-2 hover:text-primary-500 transition-colors mb-1 text-sm sm:text-base">
                {video.title}
              </h3>

              {showChannel && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/channel/${video.owner.username}`;
                  }}
                  className="text-text-secondary text-xs sm:text-sm hover:text-text-primary transition-colors cursor-pointer"
                >
                  {video.owner.fullName}
                </span>
              )}

              {/* Stats */}
              <div className="flex items-center gap-2 sm:gap-3 text-text-tertiary text-xs sm:text-sm mt-1">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{formatViewCount(video.views)} views</span>
                </div>
                <span>•</span>
                <span className="hidden sm:inline">
                  {formatRelativeTime(video.createdAt)}
                </span>
                <span className="sm:hidden">
                  {formatRelativeTime(video.createdAt).replace(" ago", "")}
                </span>
                {video.likes > 0 && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <div className="hidden sm:flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{formatViewCount(video.likes)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* More Menu */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="text-text-tertiary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const VideoCard = React.memo(VideoCardComponent);

export default VideoCard;
