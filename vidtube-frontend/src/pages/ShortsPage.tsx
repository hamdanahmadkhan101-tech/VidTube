import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefCallback,
} from "react";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Volume2, VolumeX, Clock3 } from "lucide-react";
import toast from "react-hot-toast";
import { videoService } from "../services/videoService.ts";
import { useAuthStore } from "../store/authStore";
import type { Video } from "../types";

export const ShortsPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [watchLaterOverrides, setWatchLaterOverrides] = useState<
    Record<string, boolean>
  >({});

  const viewedIdsRef = useRef<Set<string>>(new Set());
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const loadMoreObserverRef = useRef<IntersectionObserver | null>(null);
  const progressBatchRef = useRef<
    Map<
      string,
      {
        videoId: string;
        progressSeconds: number;
        completed?: boolean;
        source: "shorts-feed";
      }
    >
  >(new Map());
  const queuedProgressByVideoIdRef = useRef<Map<string, number>>(new Map());
  const flushInFlightRef = useRef(false);

  const setCardRef = useCallback(
    (videoId: string): RefCallback<HTMLElement> =>
      (node) => {
        cardRefs.current[videoId] = (node as HTMLDivElement | null) || null;
      },
    [],
  );

  const setVideoRef = useCallback(
    (videoId: string): RefCallback<HTMLVideoElement> =>
      (node) => {
        videoRefs.current[videoId] = node;
      },
    [],
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["shortsFeed"],
      queryFn: ({ pageParam }) =>
        videoService.getShortsFeed(pageParam || undefined, 8),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.nextCursor : undefined,
    });

  const toggleWatchLaterMutation = useMutation({
    mutationFn: (videoId: string) =>
      videoService.toggleWatchLater(videoId, "shorts-feed"),
    onSuccess: (payload) => {
      setWatchLaterOverrides((current) => ({
        ...current,
        [payload.videoId]: payload.isInWatchLater,
      }));
      toast.success(
        payload.isInWatchLater
          ? "Saved to Watch Later"
          : "Removed from Watch Later",
      );
    },
    onError: () => {
      toast.error("Failed to update Watch Later");
    },
  });

  const shorts = useMemo(
    () => data?.pages.flatMap((page) => page.videos) || [],
    [data],
  );
  const activeIndex = useMemo(
    () => shorts.findIndex((video) => video._id === activeVideoId),
    [shorts, activeVideoId],
  );

  const flushProgressBatch = useCallback(async () => {
    if (!isAuthenticated || flushInFlightRef.current) {
      return;
    }

    const events = Array.from(progressBatchRef.current.values());
    if (!events.length) {
      return;
    }

    flushInFlightRef.current = true;
    progressBatchRef.current.clear();

    try {
      await videoService.batchUpdateWatchProgress(events);
    } catch {
      // Keep only the newest event per video if flush fails.
      for (const event of events) {
        progressBatchRef.current.set(event.videoId, event);
      }
    } finally {
      flushInFlightRef.current = false;
    }
  }, [isAuthenticated]);

  const queueProgressEvent = useCallback(
    (video: Video, currentTimeSeconds: number) => {
      if (!isAuthenticated) {
        return;
      }

      const videoDuration = Math.max(video.duration || 0, 0);
      const safeProgress = Math.min(
        Math.max(Math.floor(currentTimeSeconds), 0),
        videoDuration,
      );

      const previouslyQueuedProgress =
        queuedProgressByVideoIdRef.current.get(video._id) || 0;

      // Throttle enqueue frequency per video to avoid noisy writes.
      if (
        safeProgress < previouslyQueuedProgress + 4 &&
        safeProgress < videoDuration
      ) {
        return;
      }

      const completionThreshold = Math.max(30, Math.floor(videoDuration * 0.9));

      queuedProgressByVideoIdRef.current.set(video._id, safeProgress);
      progressBatchRef.current.set(video._id, {
        videoId: video._id,
        progressSeconds: safeProgress,
        completed: safeProgress >= completionThreshold,
        source: "shorts-feed",
      });

      if (progressBatchRef.current.size > 20) {
        const oldestVideoId = progressBatchRef.current.keys().next().value;
        if (oldestVideoId) {
          progressBatchRef.current.delete(oldestVideoId);
        }
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (!shorts.length) {
      return;
    }

    if (!activeVideoId) {
      setActiveVideoId(shorts[0]._id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          const nextId = visibleEntries[0].target.getAttribute("data-video-id");
          if (nextId) {
            setActiveVideoId(nextId);
          }
        }
      },
      {
        threshold: [0.5, 0.75],
        rootMargin: "-8% 0px -8% 0px",
      },
    );

    for (const video of shorts) {
      const node = cardRefs.current[video._id];
      if (node) {
        observer.observe(node);
      }
    }

    return () => observer.disconnect();
  }, [shorts, activeVideoId]);

  useEffect(() => {
    for (const video of shorts) {
      const videoNode = videoRefs.current[video._id];
      if (!videoNode) {
        continue;
      }

      if (video._id === activeVideoId) {
        videoNode.muted = isMuted;
        videoNode.play().catch(() => {
          // Autoplay may be blocked by the browser until interaction.
        });

        if (!viewedIdsRef.current.has(video._id)) {
          viewedIdsRef.current.add(video._id);
          videoService.incrementViews(video._id, "shorts-feed").catch(() => {
            // Ignore errors for anonymous users or transient network failures.
          });
        }
      } else {
        videoNode.pause();
      }
    }
  }, [activeVideoId, isMuted, shorts]);

  useEffect(() => {
    if (!activeVideoId) {
      return;
    }

    const activeVideo = shorts.find((video) => video._id === activeVideoId);
    if (!activeVideo) {
      return;
    }

    const progressInterval = setInterval(() => {
      const activeVideoNode = videoRefs.current[activeVideoId];
      if (!activeVideoNode || activeVideoNode.paused) {
        return;
      }

      queueProgressEvent(activeVideo, activeVideoNode.currentTime);
    }, 2000);

    return () => clearInterval(progressInterval);
  }, [activeVideoId, shorts, queueProgressEvent]);

  useEffect(() => {
    const flushInterval = setInterval(() => {
      void flushProgressBatch();
    }, 8000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushProgressBatch();
      }
    };

    const handleBeforeUnload = () => {
      void flushProgressBatch();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(flushInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void flushProgressBatch();
    };
  }, [flushProgressBatch]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !shorts.length) {
      return;
    }

    // Prefetch the next feed slice when user is within 2 shorts of the end.
    if (activeIndex >= shorts.length - 3) {
      void fetchNextPage();
    }
  }, [
    activeIndex,
    shorts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) {
        return;
      }

      if (loadMoreObserverRef.current) {
        loadMoreObserverRef.current.disconnect();
      }

      loadMoreObserverRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) {
        loadMoreObserverRef.current.observe(node);
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  return (
    <div className="page-wrap page-stack pb-4">
      <div className="page-hero">
        <span className="kicker-pill">Quick Feed</span>
        <h1 className="page-title mt-3">Shorts</h1>
        <p className="page-subtitle mt-2">
          Swipe-worthy vertical videos with instant autoplay.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      ) : shorts.length > 0 ? (
        <div className="mx-auto w-full max-w-md h-[calc(100dvh-12rem)] overflow-y-auto snap-y snap-mandatory space-y-3 pr-1">
          {shorts.map((video: Video, index: number) => {
            const isSaved =
              watchLaterOverrides[video._id] ?? Boolean(video.isInWatchLater);
            const shouldAggressivelyPrefetch =
              activeIndex !== -1 &&
              (index === activeIndex ||
                index === activeIndex + 1 ||
                index === activeIndex + 2);

            return (
              <article
                key={video._id}
                ref={setCardRef(video._id)}
                data-video-id={video._id}
                className="relative h-[calc(100dvh-12.5rem)] snap-start rounded-2xl overflow-hidden border border-white/12 bg-black"
              >
                <video
                  ref={setVideoRef(video._id)}
                  src={video.videoUrl}
                  poster={video.thumbnailUrl}
                  className="h-full w-full object-cover"
                  playsInline
                  loop
                  muted={isMuted}
                  preload={shouldAggressivelyPrefetch ? "auto" : "metadata"}
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-black/20" />

                <button
                  onClick={() => setIsMuted((current) => !current)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/45 text-white hover:bg-black/60"
                  aria-label={isMuted ? "Unmute shorts" : "Mute shorts"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/80 mb-1">
                    @{video.owner?.username || "creator"}
                  </p>
                  <h2 className="text-white text-base font-semibold line-clamp-2 mb-2">
                    {video.title}
                  </h2>
                  <p className="text-white/80 text-sm line-clamp-2 mb-3">
                    {video.description || "No description"}
                  </p>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/watch/${video._id}`}
                      className="btn-glass text-sm px-3 py-1.5"
                    >
                      Open Video
                    </Link>

                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast.error("Please sign in to save videos");
                          return;
                        }
                        toggleWatchLaterMutation.mutate(video._id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        isSaved
                          ? "bg-primary-500 text-white border-primary-400"
                          : "bg-black/35 text-white border-white/20 hover:bg-black/50"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="w-4 h-4" />
                        {isSaved ? "Saved" : "Watch Later"}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          <div ref={loadMoreRef} className="py-4 flex justify-center">
            {isFetchingNextPage ? (
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            ) : hasNextPage ? (
              <span className="text-text-secondary text-sm">
                Loading more...
              </span>
            ) : (
              <span className="text-text-tertiary text-sm">
                You are all caught up
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state text-center">
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No shorts available yet
          </h3>
          <p className="text-text-secondary">
            Shorts will appear here as soon as creators upload them.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShortsPage;
