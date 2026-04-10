import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { VideoCard } from "../components/video/VideoCard";
import { VideoCardSkeleton } from "../components/ui/Skeleton";
import { videoService } from "../services/videoService";

export const HomePage: React.FC = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["videos"],
      queryFn: ({ pageParam = 1 }) =>
        videoService.getVideos({
          page: pageParam,
          limit: 12,
          sortBy: "views",
          sortType: "desc",
        }),
      getNextPageParam: (lastPage) =>
        lastPage?.pagination?.hasNextPage
          ? lastPage.pagination.page + 1
          : undefined,
      initialPageParam: 1,
      staleTime: 5 * 60 * 1000,
    });

  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const lastVideoRef = React.useCallback(
    (node: HTMLDivElement) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const videos = data?.pages.flatMap((page) => page.docs) || [];
  const spotlightVideo = videos[0] || null;
  const categories = [
    "sports",
    "gaming",
    "music",
    "education",
    "tech",
    "lifestyle",
  ];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card mb-5 sm:mb-8 p-4 sm:p-6 lg:p-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 items-stretch">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full border border-primary-300/35 bg-primary-400/12 px-3 py-1 text-xs font-semibold tracking-wide text-primary-100 uppercase">
              Trending this week
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-gradient leading-tight">
              Video discovery with a modern creator-first experience.
            </h1>
            <p className="text-text-secondary text-sm sm:text-lg max-w-xl">
              Explore high-performing uploads, follow creators, and publish your
              own videos with a cleaner, faster interface.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link to="/trending" className="btn-primary">
                Explore Trending
              </Link>
              <Link to="/upload" className="btn-glass">
                Upload Video
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/search?q=${encodeURIComponent(category)}`}
                  className="px-3 py-1.5 rounded-full border border-white/12 bg-white/5 text-xs sm:text-sm text-text-secondary hover:text-text-primary hover:border-primary-300/45 hover:bg-primary-400/10"
                >
                  #{category}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-background-secondary/65 p-3 sm:p-4">
            {spotlightVideo ? (
              <Link to={`/watch/${spotlightVideo._id}`} className="group block">
                <div className="aspect-video rounded-xl overflow-hidden mb-3 border border-white/10">
                  <img
                    src={
                      spotlightVideo.thumbnailUrl || "/default-thumbnail.jpg"
                    }
                    alt={spotlightVideo.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <p className="text-xs uppercase tracking-wider text-primary-200/80 mb-1">
                  Spotlight
                </p>
                <h2 className="text-base sm:text-lg font-semibold text-text-primary line-clamp-2 group-hover:text-primary-200">
                  {spotlightVideo.title}
                </h2>
                <p className="text-sm text-text-tertiary mt-1">
                  by {spotlightVideo.owner?.fullName || "Creator"}
                </p>
              </Link>
            ) : (
              <div className="aspect-video rounded-xl border border-dashed border-white/12 flex items-center justify-center text-text-tertiary text-sm">
                Spotlight appears once videos load.
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <div className="mb-4 sm:mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
            Popular Right Now
          </h2>
          <p className="text-text-secondary text-sm sm:text-base">
            Updated in real-time from your community.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 overflow-visible">
            {videos.map((video, index) => (
              <div
                key={video._id}
                ref={index === videos.length - 1 ? lastVideoRef : null}
                className="overflow-visible"
              >
                <VideoCard video={video} />
              </div>
            ))}
          </div>

          {isFetchingNextPage && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          )}

          {!hasNextPage && videos.length > 0 && (
            <div className="text-center py-12">
              <p className="text-text-secondary">You've reached the end!</p>
            </div>
          )}

          {videos.length === 0 && !isLoading && (
            <div className="glass-card p-12 text-center">
              <p className="text-text-secondary text-lg">No videos found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
