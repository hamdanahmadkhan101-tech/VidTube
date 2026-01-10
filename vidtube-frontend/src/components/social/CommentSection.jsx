import { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CommentForm from './CommentForm.jsx';
import CommentItem from './CommentItem.jsx';
import Button from '../ui/Button.jsx';
import {
  getVideoComments,
  addComment,
} from '../../services/commentService.js';

export default function CommentSection({ videoId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalComments, setTotalComments] = useState(0);

  const fetchComments = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      const response = await getVideoComments(videoId, {
        page: pageNum,
        limit: 20,
      });
      const data = response.data.data;

      if (pageNum === 1) {
        setComments(data.docs || []);
        setTotalComments(data.totalDocs || 0);
      } else {
        setComments((prev) => [...prev, ...(data.docs || [])]);
      }

      setHasMore(data.hasNextPage || false);
      setPage(pageNum);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to load comments'
      );
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const handleSubmit = async (content) => {
    setIsSubmitting(true);
    try {
      const response = await addComment(videoId, content);
      const newComment = response.data.data;
      setComments((prev) => [newComment, ...prev]);
      setTotalComments((prev) => prev + 1);
      toast.success('Comment added');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to add comment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdate = (updatedComment) => {
    setComments((prev) =>
      prev.map((c) => (c._id === updatedComment._id ? updatedComment : c))
    );
  };

  const handleCommentDelete = (commentId) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    setTotalComments((prev) => Math.max(0, prev - 1));
  };

  const formatCount = (count) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-white" />
        <h3 className="text-lg font-semibold text-white">
          {formatCount(totalComments)} Comments
        </h3>
      </div>

      {/* Comment Form */}
      <CommentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-surface-light"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-light rounded w-1/4"></div>
                <div className="h-4 bg-surface-light rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center">
          <MessageCircle className="h-12 w-12 text-textSecondary mx-auto mb-3" />
          <p className="text-textSecondary">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <>
          <div className="space-y-1 divide-y divide-border">
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                onUpdate={handleCommentUpdate}
                onDelete={handleCommentDelete}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchComments(page + 1)}
              >
                Load More Comments
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

