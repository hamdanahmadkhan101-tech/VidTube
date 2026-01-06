import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Eye,
  Calendar,
  MoreVertical,
  Trash2,
  Edit3,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import Header from "../../components/layout/Header.jsx";
import VideoPlayer from "../../components/video/VideoPlayer.jsx";
import VideoGrid from "../../components/video/VideoGrid.jsx";
import Button from "../../components/ui/Button.jsx";
import {
  getVideoById,
  deleteVideo,
  getAllVideos,
} from "../../services/videoService.js";
import useAuth from "../../hooks/useAuth.js";

export default function VideoDetailPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await getVideoById(videoId);
        setVideo(response.data.data);
      } catch (error) {
        toast.error("Failed to load video");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, navigate]);

  useEffect(() => {
    const fetchRelatedVideos = async () => {
      try {
        setRelatedLoading(true);
        const response = await getAllVideos({
          limit: 8,
          sortBy: "createdAt",
          sortType: "desc",
        });
        const filtered = response.data.data.docs.filter(
          (v) => v._id !== videoId
        );
        setRelatedVideos(filtered.slice(0, 8));
      } catch {
        // Silently fail for related videos - not critical
      } finally {
        setRelatedLoading(false);
      }
    };

    if (video) {
      fetchRelatedVideos();
    }
  }, [video, videoId]);

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this video? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteVideo(videoId);
      toast.success("Video deleted successfully");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete video");
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const isOwner =
    isAuthenticated && user && video && video.owner?._id === user._id;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-textSecondary">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Video not found</p>
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
              <VideoPlayer videoUrl={video.url} poster={video.thumbnailUrl} />
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {video.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-textSecondary">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatViews(video.views)} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(video.createdAt)}
                    </span>
                    {video.likesCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {formatViews(video.likesCount)} likes
                      </span>
                    )}
                    {video.commentsCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {formatViews(video.commentsCount)} comments
                      </span>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 hover:bg-surface rounded-full transition-colors"
                    >
                      <MoreVertical className="h-5 w-5 text-textSecondary" />
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-10">
                        <Link
                          to={`/video/${videoId}/edit`}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-zinc-700 text-white transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Edit Video</span>
                        </Link>
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>
                            {isDeleting ? "Deleting..." : "Delete Video"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Owner Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Link
                  to={`/channel/${video.owner?.username || video.owner?._id}`}
                  className="shrink-0"
                >
                  {video.owner?.avatarUrl ? (
                    <img
                      src={video.owner.avatarUrl}
                      alt={video.owner.fullName || video.owner.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                      {(video.owner?.fullName || video.owner?.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/channel/${video.owner?.username || video.owner?._id}`}
                    className="block font-semibold text-white hover:text-primary transition-colors"
                  >
                    {video.owner?.fullName ||
                      video.owner?.username ||
                      "Unknown"}
                  </Link>
                  <p className="text-sm text-textSecondary">Video Creator</p>
                </div>
              </div>

              {/* Description */}
              {video.description && (
                <div className="bg-surface rounded-lg p-4">
                  <p className="text-white whitespace-pre-wrap">
                    {video.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-white mb-4">
              Related Videos
            </h2>
            <VideoGrid
              videos={relatedVideos}
              loading={relatedLoading}
              emptyMessage="No related videos"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
