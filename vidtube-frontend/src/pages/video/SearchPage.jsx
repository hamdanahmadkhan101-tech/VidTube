import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import Header from "../../components/layout/Header.jsx";
import VideoGrid from "../../components/video/VideoGrid.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { searchVideos } from "../../services/videoService.js";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam, 1);
    }
  }, [queryParam]);

  const performSearch = async (query, pageNum = 1) => {
    if (!query.trim()) {
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchVideos(query, { page: pageNum, limit: 20 });
      const data = response.data.data;

      if (pageNum === 1) {
        setVideos(data.docs || []);
      } else {
        setVideos((prev) => [...prev, ...(data.docs || [])]);
      }

      setHasMore(data.hasNextPage || false);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchParams({ q: searchQuery.trim() });
    setPage(1);
    performSearch(searchQuery.trim(), 1);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && queryParam) {
      performSearch(queryParam, page + 1);
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setShowSortMenu(false);
    // Re-search with new sort (if backend supports it)
    if (queryParam) {
      performSearch(queryParam, 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-textSecondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button type="submit" isLoading={loading}>
              Search
            </Button>
          </form>

          {/* Results Info */}
          {queryParam && (
            <div className="flex items-center justify-between">
              <p className="text-textSecondary">
                {loading
                  ? "Searching..."
                  : videos.length > 0
                  ? `Found ${videos.length} video${
                      videos.length !== 1 ? "s" : ""
                    }`
                  : "No videos found"}
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-textSecondary hover:text-white hover:bg-surface rounded-lg transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Sort
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={() => handleSortChange("createdAt")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-light transition-colors ${
                        sortBy === "createdAt" ? "text-primary" : "text-white"
                      }`}
                    >
                      Newest First
                    </button>
                    <button
                      onClick={() => handleSortChange("views")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-light transition-colors ${
                        sortBy === "views" ? "text-primary" : "text-white"
                      }`}
                    >
                      Most Viewed
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {queryParam ? (
          <>
            <VideoGrid
              videos={videos}
              loading={loading && page === 1}
              error={error}
              emptyMessage={`No videos found for "${queryParam}"`}
            />

            {/* Load More Button */}
            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" onClick={handleLoadMore}>
                  Load More
                </Button>
              </div>
            )}

            {loading && page > 1 && (
              <div className="flex justify-center mt-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="h-16 w-16 text-textSecondary mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              Search Videos
            </h2>
            <p className="text-textSecondary text-center max-w-md">
              Enter a search query above to find videos on VidTube
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
