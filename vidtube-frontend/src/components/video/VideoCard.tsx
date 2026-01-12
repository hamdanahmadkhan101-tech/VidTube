import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, Eye, ThumbsUp, MoreVertical, ListPlus, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  cn,
  formatDuration,
  formatViewCount,
  formatRelativeTime,
} from "../../utils/helpers";
import type { Video } from "../../types";
import { AddToPlaylistModal } from "../playlist/AddToPlaylistModal";
import { useAuthStore } from "../../store/authStore";

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
  const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });
  const { user } = useAuthStore();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setShowMenu(false);
        }
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX - 200,
      });
    }
    setShowMenu(!showMenu);
  };

  const formattedDuration = React.useMemo(() => formatDuration(video.duration), [video.duration]);
  const formattedViews = React.useMemo(() => formatViewCount(video.views), [video.views]);
  const formattedTime = React.useMemo(() => formatRelativeTime(video.createdAt), [video.createdAt]);
  const formattedLikes = React.useMemo(() => formatViewCount(video.likes), [video.likes]);

  return (
    <>
      <div className={cn("bento-item group cursor-pointer", className)}>
        <Link to={`/watch/${video._id}`} className="block">
          <div className="relative aspect-video overflow-hidden rounded-t-2xl">
            <img
              src={video.thumbnailUrl || "/default-thumbnail.jpg"}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />

            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-md text-xs font-semibold text-white">
              {formattedDuration}
            </div>

            {!isMobile && (
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
            )}
          </div>

          <div className="p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
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

                <div className="flex items-center gap-2 sm:gap-3 text-text-tertiary text-xs sm:text-sm mt-1">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{formattedViews} views</span>
                  </div>
                  <span>•</span>
                  <span className="hidden sm:inline">
                    {formattedTime}
                  </span>
                  <span className="sm:hidden">
                    {formattedTime.replace(" ago", "")}
                  </span>
                  {video.likes > 0 && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <div className="hidden sm:flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{formattedLikes}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                ref={buttonRef}
                onClick={handleMenuClick}
                className="text-text-tertiary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer flex-shrink-0"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Link>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 w-56 glass-card rounded-lg shadow-xl py-2"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(false);
              setShowPlaylistModal(true);
            }}
            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ListPlus className="w-4 h-4" />
            Save to playlist
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(false);
              navigator.clipboard.writeText(`${window.location.origin}/watch/${video._id}`);
              toast.success('Link copied to clipboard!');
            }}
            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      )}

      {user && (
        <AddToPlaylistModal
          isOpen={showPlaylistModal}
          onClose={() => setShowPlaylistModal(false)}
          videoId={video._id}
          userId={user._id}
        />
      )}
    </>
  );
};

export const VideoCard = React.memo(VideoCardComponent);

export default VideoCard;
