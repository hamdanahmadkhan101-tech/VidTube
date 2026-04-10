import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { videoService } from "../services/videoService.ts";
import { VideoCard } from "../components/video/VideoCard";
import { VideoCardSkeleton } from "../components/ui/Skeleton";
import type { Video } from "../types";

export const WatchHistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["watchHistory", page],
    queryFn: () => videoService.getWatchHistory(page, 24),
  });

  const videos = data?.videos || [];
  const pagination = data?.pagination;

  return (
    <div className="page-wrap page-stack">
      <div className="page-hero">
        <span className="kicker-pill">Library</span>
        <div className="mt-3 flex items-center gap-3">
          <div className="icon-badge">
            <History className="w-5 h-5" />
          </div>
          <h1 className="page-title">Watch History</h1>
        </div>
        <p className="page-subtitle mt-2">
          Revisit videos you recently watched and jump back in instantly.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))}
        </div>
      ) : videos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video: Video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() =>
                  setPage((currentPage) => Math.max(1, currentPage - 1))
                }
                disabled={!pagination.hasPrevPage}
                className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <p className="text-text-secondary text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
              <button
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state text-center">
          <div className="icon-badge mx-auto mb-4">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No watch history yet
          </h3>
          <p className="text-text-secondary">
            Start watching videos and they will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default WatchHistoryPage;
