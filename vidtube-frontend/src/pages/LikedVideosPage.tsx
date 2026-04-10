import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { videoService } from "../services/videoService.ts";
import { VideoCard } from "../components/video/VideoCard";
import { VideoCardSkeleton } from "../components/ui/Skeleton";
import type { Video } from "../types";

export const LikedVideosPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["likedVideos"],
    queryFn: () => videoService.getLikedVideos(),
  });

  const likedVideos = data || [];

  return (
    <div className="page-wrap page-stack">
      <div className="page-hero">
        <span className="kicker-pill">Library</span>
        <div className="mt-3 flex items-center gap-3">
          <div className="icon-badge">
            <Heart className="w-5 h-5" />
          </div>
          <h1 className="page-title">Liked Videos</h1>
        </div>
        <p className="page-subtitle mt-2">
          Your favorite videos in one place so you can revisit them anytime.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))}
        </div>
      ) : likedVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {likedVideos.map((video: Video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div className="empty-state text-center">
          <div className="icon-badge mx-auto mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No liked videos yet
          </h3>
          <p className="text-text-secondary">
            Like videos to quickly find them again here.
          </p>
        </div>
      )}
    </div>
  );
};

export default LikedVideosPage;
