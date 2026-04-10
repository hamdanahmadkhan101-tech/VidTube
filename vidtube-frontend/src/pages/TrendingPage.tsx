import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { videoService } from "../services/videoService.ts";
import { VideoCard } from "../components/video/VideoCard";
import { VideoCardSkeleton } from "../components/ui/Skeleton";
import type { Video } from "../types";
import { TrendingUp } from "lucide-react";

export const TrendingPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () =>
      videoService.getVideos({
        page: 1,
        limit: 24,
        sortBy: "views",
        sortType: "desc",
      }),
  });

  const videos = data?.docs || [];

  return (
    <div className="page-wrap page-stack">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-hero"
      >
        <span className="kicker-pill">Live Rankings</span>
        <div className="mt-3 flex items-center gap-3">
          <div className="icon-badge">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h1 className="page-title">Trending</h1>
        </div>
        <p className="page-subtitle mt-2">
          Most popular videos right now, ranked by community momentum.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video: Video, index: number) => (
            <motion.div
              key={video._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative">
                {index < 3 && (
                  <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border border-yellow-200/40">
                    {index + 1}
                  </div>
                )}
                <VideoCard video={video} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-state text-center">
          <div className="icon-badge mx-auto mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No trending videos yet
          </h3>
          <p className="text-text-secondary">
            Trending videos will appear here once activity picks up.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrendingPage;
