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
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-8 h-8 text-primary-500" />
          <h1 className="text-4xl font-bold text-gradient">Trending</h1>
        </div>
        <p className="text-text-secondary text-lg">
          Most popular videos right now
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : (
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
                  <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>
                )}
                <VideoCard video={video} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingPage;
