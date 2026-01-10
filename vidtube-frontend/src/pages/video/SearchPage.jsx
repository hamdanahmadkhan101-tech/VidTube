import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import Header from "../../components/layout/Header.jsx";
import VideoGrid from "../../components/video/VideoGrid.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { EmptySearchResults } from "../../components/common/EmptyState.jsx";
import { searchVideos } from "../../services/videoService.js";
import useDebounce from "../../hooks/useDebounce.js";
import { handleApiError } from "../../utils/apiErrorHandler.js";
import { useVideoStore } from "../../store/index.js";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Debounce search query for better performance (only search after user stops typing)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const setSearchQueryStore = useVideoStore((state) => state.setSearchQuery);

  // Update store when query changes
  useEffect(() => {
    setSearchQueryStore(searchQuery);
  }, [searchQuery, setSearchQueryStore]);

  // Perform search when query param changes (from URL)
  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam, 1);
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  // Auto-search with debounced query (optional - can be disabled for explicit search only)
  // useEffect(() => {
  //   if (debouncedSearchQuery.trim() && debouncedSearchQuery !== queryParam) {
  //     setSearchParams({ q: debouncedSearchQuery.trim() });
  //   }
  // }, [debouncedSearchQuery]);

  const performSearch = useCallback(async (query, pageNum = 1) => {
    if (!query.trim()) {
      setVideos([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchVideos(query, { page: pageNum, limit: 20 });
      const docs = response.data.data || [];
      const pagination = response.data.meta?.pagination || {};

      if (pageNum === 1) {
        setVideos(docs);
      } else {
        setVideos((prev) => [...prev, ...docs]);
      }

      setHasMore(pagination.hasNextPage || false);
      setPage(pageNum);
    } catch (err) {
      handleApiError(err, {
        defaultMessage: "Failed to search videos",
        showToast: false,
      });
      setError(err.response?.data?.message || "Failed to search videos");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
          <form
            onSubmit={handleSubmit}
            className="flex gap-3 mb-4"
            role="search"
            aria-label="Search videos"
          >
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-textSecondary"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Search input"
                aria-describedby="search-help"
              />
              <span id="search-help" className="sr-only">
                Enter keywords to search for videos by title or description
              </span>
            </div>
            <Button
              type="submit"
              isLoading={loading}
              aria-label="Submit search"
            >
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
                  onBlur={() => setTimeout(() => setShowSortMenu(false), 200)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-textSecondary hover:text-white hover:bg-surface rounded-lg transition-colors"
                  aria-label="Sort options"
                  aria-expanded={showSortMenu}
                  aria-haspopup="true"
                >
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  Sort
                </button>
                {showSortMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSortMenu(false)}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20"
                      role="menu"
                      aria-label="Sort options"
                    >
                      <button
                        onClick={() => handleSortChange("createdAt")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-light transition-colors ${
                          sortBy === "createdAt" ? "text-primary" : "text-white"
                        }`}
                        role="menuitem"
                        aria-checked={sortBy === "createdAt"}
                      >
                        Newest First
                      </button>
                      <button
                        onClick={() => handleSortChange("views")}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-light transition-colors ${
                          sortBy === "views" ? "text-primary" : "text-white"
                        }`}
                        role="menuitem"
                        aria-checked={sortBy === "views"}
                      >
                        Most Viewed
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        {queryParam ? (
          <>
            {!loading && videos.length === 0 && !error ? (
              <EmptySearchResults query={queryParam} />
            ) : (
              <VideoGrid
                videos={videos}
                loading={loading && page === 1}
                error={error}
                emptyMessage={`No videos found for "${queryParam}"`}
              />
            )}

            {/* Load More Button */}
            {hasMore && !loading && videos.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" onClick={handleLoadMore}>
                  Load More
                </Button>
              </div>
            )}

            {loading && page > 1 && (
              <div
                className="flex justify-center mt-8"
                aria-label="Loading more videos"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            )}
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-20"
            role="status"
            aria-live="polite"
          >
            <Search
              className="h-16 w-16 text-textSecondary mb-4"
              aria-hidden="true"
            />
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
