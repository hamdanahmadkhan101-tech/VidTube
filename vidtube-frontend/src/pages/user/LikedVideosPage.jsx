import { useEffect, useState, useRef } from "react";
import { Heart, SortAsc } from "lucide-react";
import toast from "react-hot-toast";
import Header from "../../components/layout/Header.jsx";
import VideoGrid from "../../components/video/VideoGrid.jsx";
import Button from "../../components/ui/Button.jsx";
import { getLikedVideos, toggleVideoLike } from "../../services/likeService.js";

export default function LikedVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt"); // createdAt, title, duration
  const isInitialMount = useRef(true);

  const fetchLikedVideos = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      }

      const response = await getLikedVideos({ page: pageNum, limit: 20 });
      const docs = response.data.data || [];
      const pagination = response.data.meta?.pagination || {};

      // Extract videos from liked items
      const likedVideos = docs.map((item) => item.video || item);

      if (pageNum === 1 || reset) {
        setVideos(likedVideos);
      } else {
        setVideos((prev) => [...prev, ...likedVideos]);
      }

      setHasMore(pagination.hasNextPage || false);
      setTotalCount(pagination.total || likedVideos.length);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load liked videos:", err);
      setError("Failed to load liked videos");
      // Don't show toast on initial load
      if (!isInitialMount.current) {
        toast.error("Failed to load liked videos");
      }
    } finally {
      setLoading(false);
      isInitialMount.current = false;
    }
  };

  useEffect(() => {
    fetchLikedVideos();
  }, []);

  const handleUnlike = async (videoId) => {
    try {
      await toggleVideoLike(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      setTotalCount((prev) => prev - 1);
      toast.success("Removed from liked videos");
    } catch (err) {
      console.error("Failed to unlike video:", err);
      toast.error("Failed to unlike video");
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchLikedVideos(page + 1);
    }
  };

  // Sort videos
  const sortedVideos = [...videos].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return (a.title || "").localeCompare(b.title || "");
      case "duration":
        return (b.duration || 0) - (a.duration || 0);
      case "views":
        return (b.views || 0) - (a.views || 0);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Heart className="h-6 w-6 text-primary fill-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Liked Videos</h1>
              <p className="text-sm text-textSecondary">
                {totalCount} videos you've liked
              </p>
            </div>
          </div>

          {/* Sort Options */}
          {videos.length > 0 && (
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-textSecondary" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface-light border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="createdAt">Date Liked</option>
                <option value="title">Title</option>
                <option value="duration">Duration</option>
                <option value="views">Views</option>
              </select>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && page === 1 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
            <p className="text-textSecondary">Loading liked videos...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-6 py-4">
              <p className="text-red-400">{error}</p>
            </div>
            <Button onClick={() => fetchLikedVideos(1)} variant="primary">
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-surface-light mb-6">
              <Heart className="h-12 w-12 text-textSecondary" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No liked videos yet
            </h2>
            <p className="text-textSecondary max-w-md mb-6">
              When you like a video, it will appear here. Start exploring and
              save your favorites!
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              Explore Videos
            </Button>
          </div>
        )}

        {/* Videos Grid */}
        {!loading && !error && sortedVideos.length > 0 && (
          <>
            <VideoGrid
              videos={sortedVideos}
              loading={false}
              onUnlike={handleUnlike}
              showUnlike
            />

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" onClick={handleLoadMore}>
                  Load More
                </Button>
              </div>
            )}

            {loading && page > 1 && (
              <div className="flex justify-center mt-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
