import { useEffect, useState, useRef } from "react";
import { History, Trash2, Search, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import Header from "../../components/layout/Header.jsx";
import HistoryVideoCard from "../../components/user/HistoryVideoCard.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import {
  getWatchHistory,
  removeFromHistory,
  clearWatchHistory,
  getVideoProgress,
} from "../../services/historyService.js";

export default function WatchHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clearing, setClearing] = useState(false);
  const isInitialMount = useRef(true);

  const fetchHistory = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      }

      const response = await getWatchHistory({ page: pageNum, limit: 20 });
      const historyItems = response.data.data || [];
      const pagination = response.data.meta?.pagination || {};

      if (pageNum === 1 || reset) {
        setHistory(historyItems);
      } else {
        setHistory((prev) => [...prev, ...historyItems]);
      }

      setHasMore(pagination.hasNextPage || false);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Failed to load watch history");
      // Don't show toast on initial load
      if (!isInitialMount.current) {
        toast.error("Failed to load watch history");
      }
    } finally {
      setLoading(false);
      isInitialMount.current = false;
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRemoveVideo = async (videoId) => {
    try {
      await removeFromHistory(videoId);
      setHistory((prev) => prev.filter((item) => item._id !== videoId));
      toast.success("Removed from history");
    } catch (err) {
      console.error("Failed to remove video:", err);
      toast.error("Failed to remove video");
    }
  };

  const handleClearHistory = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all watch history? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      setClearing(true);
      await clearWatchHistory();
      setHistory([]);
      toast.success("Watch history cleared");
    } catch (err) {
      console.error("Failed to clear history:", err);
      toast.error("Failed to clear history");
    } finally {
      setClearing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchHistory(page + 1);
    }
  };

  // Filter history by search query
  const filteredHistory = searchQuery
    ? history.filter(
        (video) =>
          video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.owner?.fullName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : history;

  // Group history by date
  const groupHistoryByDate = (items) => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    items.forEach((item) => {
      const itemDate = new Date(item.watchedAt || item.createdAt);
      itemDate.setHours(0, 0, 0, 0);

      let groupKey;
      if (itemDate.getTime() === today.getTime()) {
        groupKey = "Today";
      } else if (itemDate.getTime() === yesterday.getTime()) {
        groupKey = "Yesterday";
      } else if (itemDate > weekAgo) {
        groupKey = "This Week";
      } else {
        groupKey = itemDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  };

  const groupedHistory = groupHistoryByDate(filteredHistory);

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Watch History</h1>
              <p className="text-sm text-textSecondary">
                {history.length} videos watched
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              isLoading={clearing}
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All History
            </Button>
          )}
        </div>

        {/* Search */}
        {history.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textSecondary" />
            <Input
              type="text"
              placeholder="Search your history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && page === 1 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
            <p className="text-textSecondary">Loading your history...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-6 py-4">
              <p className="text-red-400">{error}</p>
            </div>
            <Button onClick={() => fetchHistory(1)} variant="primary">
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-surface-light mb-6">
              <History className="h-12 w-12 text-textSecondary" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No watch history yet
            </h2>
            <p className="text-textSecondary max-w-md mb-6">
              Videos you watch will appear here. Start exploring and your
              history will be tracked automatically.
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              Explore Videos
            </Button>
          </div>
        )}

        {/* No Search Results */}
        {!loading &&
          searchQuery &&
          filteredHistory.length === 0 &&
          history.length > 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-textSecondary mb-4" />
              <p className="text-textSecondary">
                No videos found matching "{searchQuery}"
              </p>
            </div>
          )}

        {/* History List */}
        {!loading && !error && filteredHistory.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedHistory).map(([dateGroup, videos]) => (
              <div key={dateGroup}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-textSecondary" />
                  <h3 className="text-sm font-medium text-textSecondary uppercase tracking-wide">
                    {dateGroup}
                  </h3>
                </div>
                <div className="space-y-2 bg-surface/50 rounded-lg">
                  {videos.map((video) => (
                    <HistoryVideoCard
                      key={video._id}
                      video={video}
                      onRemove={handleRemoveVideo}
                      progress={getVideoProgress(video._id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
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
      </main>
    </div>
  );
}
