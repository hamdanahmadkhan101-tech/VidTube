import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search as SearchIcon, Filter, X, Loader2 } from "lucide-react";
import { videoService } from "../services/videoService.ts";
import { VideoCard } from "../components/video/VideoCard";
import { VideoCardSkeleton } from "../components/ui/Skeleton";
import type { Video } from "../types";

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [sortBy, setSortBy] = useState("views");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["search", query, sortBy],
    queryFn: () =>
      videoService.searchVideos({
        q: query,
        sortBy: sortBy as any,
        sortType: "desc",
        page: 1,
        limit: 24,
      }),
    enabled: !!query,
  });

  const videos = data?.docs || [];

  const handleSearch = (newQuery: string) => {
    if (newQuery.trim()) {
      setSearchParams({ q: newQuery });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="glass-card p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              defaultValue={query}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e.currentTarget.value);
                }
              }}
              placeholder="Search videos..."
              className="glass-input w-full pl-12"
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-glass flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="glass-input"
                >
                  <option value="views">Most Views</option>
                  <option value="createdAt">Latest</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results */}
      {query ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              Search results for "{query}"
            </h2>
            {!isLoading && (
              <p className="text-text-secondary">
                {videos.length} {videos.length === 1 ? "result" : "results"}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video: Video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <SearchIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No results found
              </h3>
              <p className="text-text-secondary">
                Try different keywords or remove search filters
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card p-12 text-center">
          <SearchIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Start searching
          </h3>
          <p className="text-text-secondary">
            Enter keywords to find videos you're looking for
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
