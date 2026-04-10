import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search as SearchIcon, Filter } from "lucide-react";
import { videoService } from "../services/videoService.ts";
import { VideoCard } from "../components/video/VideoCard";
import { VideoCardSkeleton } from "../components/ui/Skeleton";
import type { SearchParams, Video } from "../types";

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [sortBy, setSortBy] = useState<SearchParams["sortBy"]>("views");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["search", query, sortBy],
    queryFn: () =>
      videoService.searchVideos({
        q: query,
        sortBy,
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
    <div className="page-wrap page-stack">
      {/* Search Header */}
      <div className="page-hero">
        <span className="kicker-pill">Search</span>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title mb-1">Find Your Next Watch</h1>
            <p className="page-subtitle">
              Search by topic and narrow results by what matters most.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col md:flex-row gap-4">
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
            {showFilters ? "Hide Filters" : "Filters"}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 section-card-soft p-4"
          >
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as SearchParams["sortBy"])
                  }
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
          <div className="flex items-center justify-between">
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
            <div className="empty-state text-center">
              <div className="icon-badge mx-auto mb-4">
                <SearchIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No results found
              </h3>
              <p className="text-text-secondary">
                Try different keywords or remove search filters.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state text-center">
          <div className="icon-badge mx-auto mb-4">
            <SearchIcon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Start searching
          </h3>
          <p className="text-text-secondary">
            Enter keywords to find videos you are looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
