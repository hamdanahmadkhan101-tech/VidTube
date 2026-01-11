import React, { useState } from "react";
// import { FixedSizeList as List } from 'react-window';
import { motion } from "framer-motion";
import { MessageSquare, ArrowDown } from "lucide-react";
import { Comment } from "./Comment";
import { Skeleton } from "../ui/Skeleton";
import { useAuthStore } from "../../store/authStore";
import type { Comment as CommentType } from "../../types";

interface CommentSectionProps {
  videoId: string;
  comments: CommentType[];
  totalComments: number;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onAddComment: (content: string) => void;
  onLikeComment: (commentId: string) => void;
  onReplyComment: (commentId: string, content: string) => void;
  onEditComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  videoId: _videoId,
  comments,
  totalComments,
  isLoading,
  onLoadMore,
  hasMore,
  onAddComment,
  onLikeComment,
  onReplyComment,
  onEditComment,
  onDeleteComment,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [commentText, setCommentText] = useState("");
  const [sortBy, setSortBy] = useState<"top" | "newest">("top");

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText);
      setCommentText("");
    }
  };

  const sortedComments = React.useMemo(() => {
    if (!comments || !Array.isArray(comments)) {
      return [];
    }
    const sorted = [...comments];
    if (sortBy === "top") {
      return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return sorted.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [comments, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary-500" />
          {totalComments} {totalComments === 1 ? "Comment" : "Comments"}
        </h2>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy("top")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              sortBy === "top"
                ? "bg-primary-500 text-white shadow-glow"
                : "text-text-secondary hover:text-text-primary hover:bg-surface"
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setSortBy("newest")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              sortBy === "newest"
                ? "bg-primary-500 text-white shadow-glow"
                : "text-text-secondary hover:text-text-primary hover:bg-surface"
            }`}
          >
            Newest
          </button>
        </div>
      </div>

      {/* Add Comment Form */}
      {isAuthenticated ? (
        <div className="flex gap-3">
          <img
            src={user?.avatarUrl || user?.avatar || "/default-avatar.jpg"}
            alt={user?.username || "User"}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-primary-500/20"
          />
          <div className="flex-1 space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="glass-input w-full min-h-24 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCommentText("")}
                className="btn-ghost text-sm px-4 py-2"
                disabled={!commentText.trim()}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className="btn-primary text-sm px-6 py-2"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-center">
          <p className="text-text-secondary mb-3">Sign in to leave a comment</p>
          <a href="/login" className="btn-primary inline-block">
            Sign In
          </a>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading && comments.length === 0 ? (
          // Loading Skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))
        ) : sortedComments.length > 0 ? (
          <>
            {sortedComments.map((comment) => (
              <Comment
                key={comment._id}
                comment={comment}
                onLike={onLikeComment}
                onReply={onReplyComment}
                onEdit={onEditComment}
                onDelete={onDeleteComment}
                isOwner={user?._id === comment.owner._id}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLoadMore}
                disabled={isLoading}
                className="w-full glass-card hover:bg-surface-hover p-4 flex items-center justify-center gap-2 text-text-secondary hover:text-primary-500 transition-all font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-5 h-5" />
                    Load More Comments
                  </>
                )}
              </motion.button>
            )}
          </>
        ) : (
          <div className="glass-card p-12 text-center">
            <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">
              No comments yet. Be the first to comment!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
