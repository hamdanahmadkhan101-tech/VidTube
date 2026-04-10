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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="page-hero mb-6 sm:mb-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 items-stretch">
          <div className="space-y-5">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="kicker-pill"
            >
              ✨ Trending this week
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gradient leading-tight"
            >
              Video discovery with a modern creator-first experience.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary text-base sm:text-lg max-w-xl leading-relaxed"
            >
              Explore high-performing uploads, follow creators, and publish your
              own videos with a cleaner, faster interface built for creators.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <Link to="/trending" className="btn-primary hover:shadow-glow">
                Explore Trending
              </Link>
              <Link to="/upload" className="btn-glass hover:shadow-elevation-2">
                Upload Video
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2.5 pt-1"
            >
              {categories.map((category, idx) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                >
                  <Link
                    to={`/search?q=${encodeURIComponent(category)}`}
                    className="px-3.5 py-2 rounded-full border border-primary-500/25 bg-primary-500/8 text-xs sm:text-sm font-medium text-text-secondary hover:text-primary-300 hover:border-primary-400/50 hover:bg-primary-500/15 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    #{category}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="section-card p-4 sm:p-5 overflow-hidden"
          >
            {spotlightVideo ? (
              <Link to={`/watch/${spotlightVideo._id}`} className="group block">
                <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-primary-500/20 shadow-elevation-2 group-hover:shadow-glow transition-all duration-300">
                  <img
                    src={
                      spotlightVideo.thumbnailUrl || "/default-thumbnail.jpg"
                    }
                    alt={spotlightVideo.title}
                    className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-400/80 mb-2">
                  ⭐ Spotlight
                </p>
                <h2 className="text-base sm:text-lg font-bold text-text-primary line-clamp-2 group-hover:text-primary-300 transition-colors duration-300">
                  {spotlightVideo.title}
                </h2>
                <p className="text-sm text-text-tertiary mt-2 group-hover:text-text-secondary transition-colors">
                  by {spotlightVideo.owner?.fullName || "Creator"}
                </p>
              </Link>
            ) : (
              <div className="aspect-video rounded-xl border-2 border-dashed border-primary-500/20 flex flex-col items-center justify-center text-text-tertiary gap-2">
                <span className="text-2xl">🎬</span>
                <p className="text-sm text-text-muted">Videos loading...</p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6 sm:mb-8 flex items-end justify-between"
      >
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-2">
            Popular Right Now
          </h2>
          <p className="text-text-secondary text-sm sm:text-base flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary-400/60 animate-pulse" />
            Updated in real-time from your community.
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 overflow-visible"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
          >
            {videos.map((video, index) => (
              <motion.div
                key={video._id}
                ref={index === videos.length - 1 ? lastVideoRef : null}
                className="overflow-visible"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <VideoCard video={video} />
              </motion.div>
            ))}
          </motion.div>

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
