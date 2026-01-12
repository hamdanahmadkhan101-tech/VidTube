import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { VideoCard } from "../components/video/VideoCard";
import { VideoCardSkeleton } from "../components/ui/Skeleton";
import { videoService } from "../services/videoService";

export const HomePage: React.FC = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const videos = data?.pages.flatMap((page) => page.docs) || [];

  return (
    <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gradient mb-2">
          Trending Now
        </h1>
        <p className="text-text-secondary text-sm sm:text-lg">
          Discover the most popular videos on VidTube
        </p>
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
