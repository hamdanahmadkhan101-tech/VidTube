import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteVideo } from '../../services/videoService.js';
import { handleApiError, handleApiSuccess } from '../../utils/apiErrorHandler.js';
import LikeButton from '../social/LikeButton.jsx';

/**
 * Video Actions Component
 * Handles video actions (like, edit, delete) for owners
 */
export default function VideoActions({ videoId, video, isOwner, onVideoUpdate }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete this video? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteVideo(videoId);
      handleApiSuccess('Video deleted successfully');
      navigate('/');
    } catch (error) {
      handleApiError(error, { defaultMessage: 'Failed to delete video' });
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="flex items-center gap-3 pb-4 border-b border-border">
      <LikeButton
        videoId={videoId}
        initialLikesCount={video?.likesCount || 0}
        initialIsLiked={video?.isLiked || false}
        onLikeChange={(isLiked, count) => {
          if (onVideoUpdate) {
            onVideoUpdate({ isLiked, likesCount: count });
          }
        }}
      />

      {isOwner && (
        <div className="relative ml-auto">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-surface rounded-full transition-colors"
            aria-label="Video options"
            aria-expanded={showMenu}
          >
            <MoreVertical className="h-5 w-5 text-textSecondary" />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20">
                <Link
                  to={`/video/${videoId}/edit`}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-zinc-700 text-white transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Video</span>
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50"
                  aria-label="Delete video"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Video'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
