/**
 * Loading Skeleton Components
 * Reusable skeleton loaders for better UX
 */

export function VideoCardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="aspect-video bg-surface rounded-lg" />
      <div className="space-y-2">
        <div className="h-4 bg-surface rounded w-3/4" />
        <div className="h-3 bg-surface rounded w-1/2" />
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function VideoPlayerSkeleton() {
  return (
    <div className="aspect-video bg-surface rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-textSecondary">Loading video player...</div>
    </div>
  );
}

export function VideoDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <VideoPlayerSkeleton />
      <div className="space-y-4">
        <div className="h-8 bg-surface rounded w-3/4" />
        <div className="flex gap-4">
          <div className="h-4 bg-surface rounded w-24" />
          <div className="h-4 bg-surface rounded w-24" />
          <div className="h-4 bg-surface rounded w-24" />
        </div>
        <div className="h-20 bg-surface rounded" />
      </div>
    </div>
  );
}

export function ChannelHeaderSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 bg-surface rounded-lg" />
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-surface rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-surface rounded w-48" />
          <div className="h-4 bg-surface rounded w-32" />
        </div>
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-10 h-10 bg-surface rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface rounded w-24" />
        <div className="h-4 bg-surface rounded w-full" />
        <div className="h-4 bg-surface rounded w-2/3" />
      </div>
    </div>
  );
}

export function CommentListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}
