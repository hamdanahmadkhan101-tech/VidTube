import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Play,
  Users,
  Video as VideoIcon,
  Grid3x3,
  List,
  Calendar,
  Eye,
  ThumbsUp,
  Loader2,
} from "lucide-react";
import { authService } from "../services/authService.ts";
import { videoService } from "../services/videoService.ts";
import { subscriptionService } from "../services/subscriptionService.ts";
import { VideoCard } from "../components/video/VideoCard";
import { useAuthStore } from "../store/authStore.ts";
import toast from "react-hot-toast";
import type { User, Video } from "../types";

type TabType = "videos" | "about";

export const ChannelPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("videos");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Fetch channel/user data
  const {
    data: channelUser,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ["user", username],
    queryFn: () => authService.getUserProfile(username!),
    enabled: !!username,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => subscriptionService.toggleSubscription(channelUser!._id),
    onSuccess: (data) => {
      queryClient.setQueryData(["user", username], (old: any) => ({
        ...old,
        isSubscribed: data.isSubscribed,
        subscribersCount: data.subscribersCount,
      }));
      toast.success(data.isSubscribed ? "Subscribed!" : "Unsubscribed");
    },
    onError: () => {
      toast.error("Failed to update subscription");
    },
  });

  // Fetch user's videos
  const { data: videosData, isLoading: isLoadingVideos } = useQuery({
    queryKey: ["channelVideos", channelUser?._id],
    queryFn: async () => {
      if (!channelUser?._id) return { docs: [], pagination: {} };
      return await videoService.getUserVideos(channelUser._id, 1, 20);
    },
    enabled: !!channelUser?._id,
  });

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500" />
      </div>
    );
  }

  if (userError || !channelUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Channel Not Found
          </h2>
          <p className="text-text-secondary mb-4">
            The channel you're looking for doesn't exist.
          </p>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwnChannel = currentUser?.username === username;
  const videos = videosData?.docs || [];

  return (
    <div className="min-h-screen pb-20">
      {/* Channel Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-primary-900 to-accent-blue overflow-hidden">
          {channelUser.coverUrl || channelUser.coverImage ? (
            <img
              src={channelUser.coverUrl || channelUser.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-500/20 to-accent-blue/20 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <VideoIcon className="w-16 h-16 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">No cover image</p>
              </div>
            </div>
          )}
        </div>

        {/* Channel Info */}
        <div className="container mx-auto px-4">
          <div className="glass-card -mt-16 p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-glow">
                  {channelUser.avatarUrl || channelUser.avatar ? (
                    <img
                      src={channelUser.avatarUrl || channelUser.avatar}
                      alt={channelUser.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface flex items-center justify-center">
                      <Users className="w-16 h-16 text-text-muted" />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Channel Details */}
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                  {channelUser.fullName}
                </h1>
                <p className="text-text-secondary mb-4">
                  @{channelUser.username}
                </p>

                <div className="flex flex-wrap gap-6 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {channelUser.subscribersCount?.toLocaleString() || 0}{" "}
                      subscribers
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <VideoIcon className="w-4 h-4" />
                    <span>{videos.length} videos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined{" "}
                      {new Date(channelUser.createdAt).toLocaleDateString(
                        "en-US",
                        { month: "short", year: "numeric" }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscribe/Edit Button */}
              <div>
                {isOwnChannel ? (
                  <Link to="/settings" className="btn-glass">
                    Edit Channel
                  </Link>
                ) : (
                  <button
                    onClick={() => subscribeMutation.mutate()}
                    disabled={subscribeMutation.isPending}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      channelUser.isSubscribed
                        ? "bg-surface hover:bg-surface-hover text-text-primary"
                        : "bg-primary-500 hover:bg-primary-600 text-white shadow-glow"
                    }`}
                  >
                    {subscribeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        {channelUser.isSubscribed ? "Subscribed" : "Subscribe"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {channelUser.bio && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 pt-6 border-t border-white/10"
              >
                <p className="text-text-secondary whitespace-pre-wrap">
                  {channelUser.bio}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-8">
        <div className="glass-card p-1 inline-flex rounded-xl">
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-6 py-2 rounded-lg transition-all ${
              activeTab === "videos"
                ? "bg-primary-500 text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <div className="flex items-center gap-2">
              <VideoIcon className="w-4 h-4" />
              Videos
            </div>
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`px-6 py-2 rounded-lg transition-all ${
              activeTab === "about"
                ? "bg-primary-500 text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            About
          </button>
        </div>

        {/* View Toggle (only for videos tab) */}
        {activeTab === "videos" && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-colors ${
                view === "grid"
                  ? "bg-primary-500 text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition-colors ${
                view === "list"
                  ? "bg-primary-500 text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 mt-8">
        {activeTab === "videos" ? (
          <>
            {isLoadingVideos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton h-64" />
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                }
              >
                {videos.map((video: Video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <VideoIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  No videos yet
                </h3>
                <p className="text-text-secondary">
                  {isOwnChannel
                    ? "Upload your first video to get started!"
                    : "This channel hasn't uploaded any videos yet."}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="glass-card p-8 max-w-3xl">
            <h2 className="text-2xl font-bold text-text-primary mb-6">About</h2>

            <div className="space-y-6">
              {channelUser.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2">
                    Description
                  </h3>
                  <p className="text-text-primary whitespace-pre-wrap">
                    {channelUser.bio}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">
                  Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 text-text-secondary mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Subscribers</span>
                    </div>
                    <p className="text-2xl font-bold text-text-primary">
                      {channelUser.subscribersCount?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 text-text-secondary mb-1">
                      <VideoIcon className="w-4 h-4" />
                      <span className="text-sm">Videos</span>
                    </div>
                    <p className="text-2xl font-bold text-text-primary">
                      {videos.length}
                    </p>
                  </div>
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-2 text-text-secondary mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Joined</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      {new Date(channelUser.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {channelUser.socialLinks &&
                Object.keys(channelUser.socialLinks).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary mb-2">
                      Links
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(channelUser.socialLinks).map(
                        ([platform, url]) => (
                          <a
                            key={platform}
                            href={url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-glass text-sm"
                          >
                            {platform}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelPage;
