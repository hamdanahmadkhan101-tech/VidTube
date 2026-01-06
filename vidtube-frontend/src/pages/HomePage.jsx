import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import Header from "../components/layout/Header.jsx";
import VideoGrid from "../components/video/VideoGrid.jsx";
import Button from "../components/ui/Button.jsx";
import { getAllVideos } from "../services/videoService.js";
import useAuth from "../hooks/useAuth.js";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const isInitialMount = useRef(true);
  const hasShownError = useRef(false);

  // Fetch videos function - no useCallback to avoid stale closures
  const fetchVideos = async (pageNum = 1, currentSortBy = sortBy) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      }
      const response = await getAllVideos({
        page: pageNum,
        limit: 20,
        sortBy: currentSortBy,
        sortType: "desc",
      });
      const data = response.data.data;

      if (pageNum === 1) {
        setVideos(data.docs || []);
      } else {
        setVideos((prev) => [...prev, ...(data.docs || [])]);
      }

      setHasMore(data.hasNextPage || false);
      setPage(pageNum);
      setError(null);
      hasShownError.current = false;
    } catch (err) {
      console.error("Failed to load videos:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to load videos. Please try again.";
      setError(errorMessage);
      // Only show toast error once, not on initial load if no videos exist
      if (!isInitialMount.current && !hasShownError.current) {
        toast.error(errorMessage);
        hasShownError.current = true;
      }
    } finally {
      setLoading(false);
      isInitialMount.current = false;
    }
  };

  // Initial load and sortBy change
  useEffect(() => {
    fetchVideos(1, sortBy);
  }, [sortBy]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchVideos(page + 1, sortBy);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section - Only show when no videos or not authenticated */}
        {!isAuthenticated && videos.length === 0 && !loading && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 text-center mb-12">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface-light px-4 py-1.5 shadow-sm transition-all hover:shadow-md hover:border-zinc-500">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-textSecondary">
                Join thousands of creators
              </span>
            </div>

            <h2 className="mb-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Share your <span className="text-primary">videos</span> with the
              world
            </h2>

            <p className="mb-10 max-w-2xl text-lg text-textSecondary sm:text-xl">
              Upload, share, and discover amazing content. Connect with creators
              and build your audience on VidTube.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/register">
                <Button size="lg">Get started free</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Videos Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {sortBy === "views" ? "Trending Videos" : "Latest Videos"}
          </h2>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "createdAt" ? "primary" : "outline"}
              size="sm"
              onClick={() => setSortBy("createdAt")}
            >
              Latest
            </Button>
            <Button
              variant={sortBy === "views" ? "primary" : "outline"}
              size="sm"
              onClick={() => setSortBy("views")}
            >
              Trending
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-6 py-4 max-w-md">
              <p className="text-red-400">{error}</p>
            </div>
            <Button onClick={() => fetchVideos(1, sortBy)} variant="primary">
              Retry
            </Button>
          </div>
        )}

        {!error && <VideoGrid videos={videos} loading={loading} />}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={handleLoadMore}>
              Load More Videos
            </Button>
          </div>
        )}

        {loading && page > 1 && (
          <div className="flex justify-center mt-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        )}
      </main>
    </div>
  );
}
