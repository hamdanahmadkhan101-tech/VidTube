import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Video as VideoIcon,
  Eye,
  ThumbsUp,
  BarChart3,
  TrendingUp,
  Edit2,
} from "lucide-react";
import { videoService } from "../services/videoService.ts";
import { authService } from "../services/authService.ts";
import type { Video } from "../types";
import { useAuthStore } from "../store/authStore.ts";
import { formatViewCount, formatRelativeTime } from "../utils/helpers";

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month",
  );

  // Fetch current user profile with fresh subscriber count
  const { data: currentUserProfile } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: authService.getCurrentUser,
    enabled: !!user?._id,
    staleTime: 30000, // Refresh every 30 seconds
  });

  // Fetch user's own videos
  const {
    data: videosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myVideos", user?._id],
    queryFn: async () => {
      if (!user?._id) {
        return {
          docs: [],
          pagination: {
            page: 1,
            limit: 50,
            totalDocs: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
      return videoService.getUserVideos(user._id, 1, 50);
    },
    enabled: !!user?._id,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const videos = videosData?.docs || [];
  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum: number, v: Video) => sum + v.views, 0);
  const totalLikes = videos.reduce((sum: number, v: Video) => sum + v.likes, 0);
  // Use fresh subscriber count from profile query, fallback to auth store
  const subscribersCount =
    currentUserProfile?.subscribersCount ?? user?.subscribersCount ?? 0;

  return (
    <div className="page-wrap page-stack">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-stack"
      >
        <div className="page-hero">
          <span className="kicker-pill">Creator Studio</span>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="page-title mb-1">Dashboard</h1>
              <p className="page-subtitle">
                Track channel performance and manage your latest videos.
              </p>
            </div>
            <Link to="/upload" className="btn-primary">
              Upload Video
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {error && (
            <div className="col-span-full section-card p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm">
                Error loading videos: {String(error)}
              </p>
            </div>
          )}
          <div className="stat-tile">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-badge">
                <VideoIcon className="w-6 h-6 text-primary-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-text-secondary text-sm mb-1">Total Videos</p>
            <p className="text-3xl font-bold text-text-primary">
              {isLoading ? "..." : totalVideos}
            </p>
          </div>

          <div className="stat-tile">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-badge">
                <Eye className="w-6 h-6 text-accent-blue" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-text-secondary text-sm mb-1">Total Views</p>
            <p className="text-3xl font-bold text-text-primary">
              {isLoading ? "..." : formatViewCount(totalViews)}
            </p>
          </div>

          <div className="stat-tile">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-badge">
                <ThumbsUp className="w-6 h-6 text-accent-pink" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-text-secondary text-sm mb-1">Total Likes</p>
            <p className="text-3xl font-bold text-text-primary">
              {isLoading ? "..." : formatViewCount(totalLikes)}
            </p>
          </div>

          <div className="stat-tile">
            <div className="flex items-center justify-between mb-4">
              <div className="icon-badge">
                <BarChart3 className="w-6 h-6 text-accent-cyan" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-text-secondary text-sm mb-1">Subscribers</p>
            <p className="text-3xl font-bold text-text-primary">
              {formatViewCount(subscribersCount)}
            </p>
          </div>
        </div>

        {/* Recent Videos */}
        <div className="section-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              Your Videos
            </h2>
            <select
              value={timeRange}
              onChange={(e) =>
                setTimeRange(e.target.value as "week" | "month" | "year")
              }
              className="glass-input w-full sm:w-auto"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="year">Last year</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-20" />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map((video: Video) => (
                <div
                  key={video._id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl section-card-soft hover:bg-surface-hover transition-colors group"
                >
                  <Link
                    to={`/watch/${video._id}`}
                    className="shrink-0 w-full sm:w-auto"
                  >
                    <img
                      src={video.thumbnailUrl || "/default-thumbnail.jpg"}
                      alt={video.title}
                      className="w-full sm:w-32 h-44 sm:h-20 object-cover rounded-lg"
                    />
                  </Link>
                  <Link to={`/watch/${video._id}`} className="flex-1 min-w-0">
                    <h3 className="text-text-primary font-semibold line-clamp-1 mb-1">
                      {video.title}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {formatRelativeTime(video.createdAt)}
                    </p>
                  </Link>
                  <div className="flex items-center gap-4 sm:gap-6 text-sm text-text-secondary w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewCount(video.views)}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {formatViewCount(video.likes)}
                    </div>
                  </div>
                  <Link
                    to={`/edit/${video._id}`}
                    className="btn-glass opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state text-center py-12">
              <div className="icon-badge mx-auto mb-4">
                <VideoIcon className="w-6 h-6" />
              </div>
              <p className="text-text-secondary">No videos yet</p>
              <Link to="/upload" className="btn-primary mt-4">
                Upload Your First Video
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
