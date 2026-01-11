import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp,
  MessageCircle,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import { formatRelativeTime, formatViewCount, cn } from "../../utils/helpers";
import DOMPurify from "dompurify";
import type { Comment as CommentType } from "../../types";

interface CommentProps {
  comment: CommentType;
  onLike?: (commentId: string) => void;
  onReply?: (commentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  isOwner?: boolean;
  depth?: number;
}

export const Comment: React.FC<CommentProps> = ({
  comment,
  onLike,
  onReply,
  onEdit,
  onDelete,
  isOwner = false,
  depth = 0,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.content);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const handleLike = () => {
    onLike?.(comment._id);
  };

  const handleReply = () => {
    if (replyText.trim()) {
      onReply?.(comment._id, replyText);
      setReplyText("");
      setShowReplyForm(false);
    }
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== comment.content) {
      onEdit?.(comment._id, editText);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      onDelete?.(comment._id);
    }
  };

  // Sanitize comment content
  const sanitizedContent = DOMPurify.sanitize(comment.content, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br"],
    ALLOWED_ATTR: ["href", "target"],
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", depth > 0 && "ml-12")}
    >
      {/* Avatar */}
      <img
        src={
          comment.owner.avatarUrl ||
          comment.owner.avatar ||
          "/default-avatar.jpg"
        }
        alt={comment.owner.username}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-primary-500/20"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-text-primary font-semibold text-sm">
            {comment.owner.fullName}
          </span>
          <span className="text-text-tertiary text-xs">
            @{comment.owner.username}
          </span>
          <span className="text-text-muted text-xs">
            {formatRelativeTime(comment.createdAt)}
          </span>

          {isOwner && (
            <div className="ml-auto relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-text-tertiary hover:text-text-primary transition-colors p-1"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 glass-card p-1 min-w-32 z-10"
                  >
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Comment Body */}
        {isEditing ? (
          <div className="space-y-2 mb-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="glass-input w-full min-h-20 resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="btn-primary text-sm px-4 py-2"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.content);
                }}
                className="btn-ghost text-sm px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-text-secondary text-sm mb-2 whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors",
                comment.isLiked
                  ? "text-primary-500"
                  : "text-text-tertiary hover:text-primary-500"
              )}
            >
              <ThumbsUp
                className="w-4 h-4"
                fill={comment.isLiked ? "currentColor" : "none"}
              />
              {comment.likes > 0 && (
                <span className="font-medium">
                  {formatViewCount(comment.likes)}
                </span>
              )}
            </button>

            {depth < 3 && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-sm text-text-tertiary hover:text-primary-500 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Reply
              </button>
            )}

            {comment.repliesCount && comment.repliesCount > 0 && (
              <span className="text-xs text-text-muted">
                {comment.repliesCount}{" "}
                {comment.repliesCount === 1 ? "reply" : "replies"}
              </span>
            )}
          </div>
        )}

        {/* Reply Form */}
        <AnimatePresence>
          {showReplyForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add a reply..."
                className="glass-input w-full min-h-20 resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText("");
                  }}
                  className="btn-ghost text-sm px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {(showAllReplies
              ? comment.replies
              : comment.replies.slice(0, 3)
            ).map((reply) => (
              <Comment
                key={reply._id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                isOwner={isOwner}
                depth={depth + 1}
              />
            ))}

            {comment.replies.length > 3 && !showAllReplies && (
              <button
                onClick={() => setShowAllReplies(true)}
                className="ml-12 text-sm text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                Show {comment.replies.length - 3} more{" "}
                {comment.replies.length - 3 === 1 ? "reply" : "replies"}
              </button>
            )}

            {showAllReplies && comment.replies.length > 3 && (
              <button
                onClick={() => setShowAllReplies(false)}
                className="ml-12 text-sm text-text-tertiary hover:text-text-primary font-medium"
              >
                Show less
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Comment;
