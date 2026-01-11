import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  Share2,
  Download,
  Flag,
  Eye,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit2,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { VideoPlayer } from "../components/video/VideoPlayer";
import { VideoCard } from "../components/video/VideoCard";
import { CommentSection } from "../components/comment/CommentSection";
import { VideoPageSkeleton } from "../components/ui/Skeleton";
import { ReportModal } from "../components/ui/ReportModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { videoService } from "../services/videoService";
import { commentService } from "../services/commentService";
import { subscriptionService } from "../services/subscriptionService";
import { useAuthStore } from "../store/authStore";
import { formatViewCount, formatRelativeTime, cn } from "../utils/helpers";
import toast from "react-hot-toast";
import type { Video } from "../types";

export const VideoPlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch video data
  const {
    data: video,
    isLoading: videoLoading,
    error: videoError,
  } = useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      const videoData = await videoService.getVideoById(videoId!);
      // Increment view count
      videoService.incrementViews(videoId!).catch(() => {
        // Silently fail - views are not critical
      });
      return videoData;
    },
    enabled: !!videoId,
  });

  // Fetch related videos
  const { data: relatedVideos } = useQuery({
    queryKey: ["related-videos", video?.category],
    queryFn: () =>
      videoService.getVideos({ category: video?.category, limit: 10 }),
    enabled: !!video?.category,
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", videoId, commentPage],
    queryFn: () => commentService.getVideoComments(videoId!, commentPage, 20),
    enabled: !!videoId,
  });

  // Like video mutation
  const likeMutation = useMutation({
    mutationFn: () => videoService.toggleLike(videoId!),
    onSuccess: (data) => {
      queryClient.setQueryData(["video", videoId], (old: Video) => ({
        ...old,
        isLiked: data.isLiked,
        likes: data.likesCount,
      }));
    },
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => subscriptionService.toggleSubscription(video!.owner._id),
    onSuccess: (data) => {
      queryClient.setQueryData(["video", videoId], (old: Video) => ({
        ...old,
        owner: {
          ...old.owner,
          isSubscribed: data.isSubscribed,
          subscribersCount: data.subscribersCount,
        },
      }));
      toast.success(data.isSubscribed ? "Subscribed!" : "Unsubscribed");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update subscription";
      toast.error(errorMessage);
    },
  });

  // Report video mutation
  const reportMutation = useMutation({
    mutationFn: ({
      reason,
      description,
    }: {
      reason: string;
      description?: string;
    }) => videoService.reportVideo(videoId!, reason, description),
    onSuccess: () => {
      toast.success("Video reported. Thank you for your feedback.");
    },
    onError: (error: any) => {
      // Only show error if not a connection error
      if (
        error?.code !== "ERR_NETWORK" &&
        error?.code !== "ERR_CONNECTION_REFUSED"
      ) {
        const errorMessage =
          error?.response?.data?.message || "Failed to report video";
        toast.error(errorMessage);
      }
      console.error("Report error:", error);
    },
    retry: false,
  });

  // Comment mutations
  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      commentService.createComment(videoId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      toast.success("Comment added!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to add comment";
      toast.error(errorMessage);
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentService.toggleLike(commentId),
    onMutate: async (commentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["comments", videoId] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData(["comments", videoId]);

      // Optimistically update
      queryClient.setQueryData(["comments", videoId], (old: any) => {
        if (!old) return old;

        const updateComment = (comment: any): any => {
          if (comment._id === commentId) {
            return {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(updateComment),
            };
          }
          return comment;
        };

        return {
          ...old,
          docs: old.docs.map(updateComment),
        };
      });

      return { previousComments };
    },
    onError: (err, commentId, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["comments", videoId],
          context.previousComments
        );
      }
      toast.error("Failed to update like");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });

  const replyCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => commentService.createComment(videoId!, content, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      toast.success("Reply added!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to add reply";
      toast.error(errorMessage);
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => commentService.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      toast.success("Comment updated!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update comment";
      toast.error(errorMessage);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      toast.success("Comment deleted!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to delete comment";
      toast.error(errorMessage);
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: () => videoService.deleteVideo(videoId!),
    onSuccess: () => {
      toast.success("Video deleted!");
      navigate("/");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to delete video";
      toast.error(errorMessage);
    },
  });

  const handleShare = async () => {
    try {
      await navigator.share({
        title: video?.title,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to report videos");
      return;
    }
    setShowReportModal(true);
  };

  const handleDeleteVideo = () => {
    deleteVideoMutation.mutate();
    setShowDeleteModal(false);
  };

  const isVideoOwner = isAuthenticated && user?._id === video?.owner._id;

  if (videoLoading || !video) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VideoPageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (videoError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Video Not Found
          </h2>
          <p className="text-text-secondary mb-6">
            The video you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-6">
          {/* Video Player */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {video.videoUrl ? (
              <VideoPlayer
                videoUrl={video.videoUrl}
                thumbnailUrl={video.thumbnailUrl}
              />
            ) : (
              <div className="glass-card aspect-video flex items-center justify-center">
                <p className="text-text-secondary">
                  Video source not available
                </p>
              </div>
            )}
          </motion.div>

          {/* Video Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3 sm:space-y-4"
          >
            {/* Title */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary flex-1">
                {video.title}
              </h1>

              {/* Video Owner Menu */}
              {isVideoOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowVideoMenu(!showVideoMenu)}
                    className="glass-card hover:bg-surface-hover p-2 rounded-xl text-text-primary transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {showVideoMenu && (
                    <div className="absolute right-0 top-full mt-2 glass-card p-2 min-w-48 z-10">
                      <Link
                        to={`/studio/videos/${videoId}/edit`}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Video
                      </Link>
                      <button
                        onClick={() => {
                          setShowVideoMenu(false);
                          setShowDeleteModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-surface-hover rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Video
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats & Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
              {/* Stats */}
              <div className="flex items-center gap-3 sm:gap-4 text-text-secondary text-xs sm:text-sm flex-wrap">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{formatViewCount(video.views || 0)} views</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{formatRelativeTime(video.createdAt)}</span>
                </div>
                {video.category && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="capitalize">{video.category}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => likeMutation.mutate()}
                  disabled={!isAuthenticated}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all cursor-pointer",
                    video.isLiked
                      ? "bg-primary-500 text-white shadow-glow"
                      : "glass-card hover:bg-surface-hover text-text-primary",
                    !isAuthenticated && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <ThumbsUp
                    className="w-5 h-5"
                    fill={video.isLiked ? "currentColor" : "none"}
                  />
                  <span>{formatViewCount(video.likes || 0)}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="glass-card hover:bg-surface-hover px-4 py-2 rounded-xl flex items-center gap-2 text-text-primary font-medium transition-all cursor-pointer"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>

                <a
                  href={video.url || video.videoUrl}
                  download={`${video.title}.mp4`}
                  className="glass-card hover:bg-surface-hover px-4 py-2 rounded-xl flex items-center gap-2 text-text-primary font-medium transition-all cursor-pointer"
                  title="Download video"
                >
                  <Download className="w-5 h-5" />
                </a>

                <button
                  onClick={handleReport}
                  disabled={!isAuthenticated}
                  className={cn(
                    "glass-card hover:bg-surface-hover p-2 rounded-xl text-text-primary transition-all cursor-pointer",
                    !isAuthenticated && "opacity-50 cursor-not-allowed"
                  )}
                  title="Report video"
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Channel Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-3 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
              <Link
                to={`/channel/${video.owner.username}`}
                className="flex items-center gap-4 flex-1"
              >
                <img
                  src={
                    video.owner.avatarUrl ||
                    video.owner.avatar ||
                    "/default-avatar.jpg"
                  }
                  alt={video.owner.username}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-500/20 hover:ring-primary-500/50 transition-all"
                />
                <div>
                  <h3 className="text-text-primary font-semibold hover:text-primary-500 transition-colors">
                    {video.owner.fullName}
                  </h3>
                  <p className="text-text-tertiary text-sm">
                    {formatViewCount(video.owner.subscribersCount || 0)}{" "}
                    subscribers
                  </p>
                </div>
              </Link>

              {isAuthenticated && user?._id !== video.owner._id && (
                <button
                  onClick={() => subscribeMutation.mutate()}
                  disabled={subscribeMutation.isPending}
                  className={cn(
                    "px-6 py-2 rounded-xl font-medium transition-all cursor-pointer",
                    video.owner.isSubscribed
                      ? "glass-card hover:bg-surface-hover text-text-primary"
                      : "bg-primary-500 text-white shadow-glow hover:bg-primary-600",
                    subscribeMutation.isPending &&
                      "opacity-50 cursor-not-allowed"
                  )}
                >
                  {video.owner.isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>

            {/* Description */}
            {video.description && (
              <div className="mt-4">
                <div
                  className={cn(
                    "text-text-secondary text-sm whitespace-pre-wrap",
                    !showFullDescription && "line-clamp-3"
                  )}
                >
                  {video.description}
                </div>
                {video.description.length > 200 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 text-text-primary hover:text-primary-500 transition-colors flex items-center gap-1 text-sm font-medium"
                  >
                    {showFullDescription ? (
                      <>
                        Show Less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show More <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {video.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-3 py-1 bg-surface rounded-full text-xs text-text-secondary"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CommentSection
              videoId={videoId!}
              videoOwnerId={video.owner._id}
              comments={commentsData?.docs || []}
              totalComments={commentsData?.pagination.totalDocs || 0}
              isLoading={commentsLoading}
              hasMore={commentsData?.pagination.hasNextPage}
              onLoadMore={() => setCommentPage((p) => p + 1)}
              onAddComment={(content) => addCommentMutation.mutate(content)}
              onLikeComment={(commentId) =>
                likeCommentMutation.mutate(commentId)
              }
              onReplyComment={(commentId, content) =>
                replyCommentMutation.mutate({ commentId, content })
              }
              onEditComment={(commentId, content) =>
                editCommentMutation.mutate({ commentId, content })
              }
              onDeleteComment={(commentId) =>
                deleteCommentMutation.mutate(commentId)
              }
            />
          </motion.div>
        </div>

        {/* Sidebar - Up Next */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="sticky top-6 space-y-4"
          >
            <h2 className="text-xl font-bold text-text-primary">Up Next</h2>

            <div className="space-y-4">
              {relatedVideos?.docs.map((relatedVideo) => (
                <VideoCard
                  key={relatedVideo._id}
                  video={relatedVideo}
                  showChannel={true}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={(reason, description) =>
          reportMutation.mutate({ reason, description })
        }
        isSubmitting={reportMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteVideo}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone and all comments will be lost."
        confirmText="Delete Video"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default VideoPlayerPage;
