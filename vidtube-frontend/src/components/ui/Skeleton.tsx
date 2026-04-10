import React from 'react';
import { cn } from '../../utils/helpers';

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, shimmer = true }) => {
  return (
    <div
      className={cn(
        shimmer ? 'skeleton-shimmer' : 'skeleton',
        'rounded-lg',
        className
      )}
    />
  );
};

export const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="bento-item overflow-hidden">
      {/* Thumbnail Skeleton */}
      <Skeleton className="aspect-video rounded-t-2xl w-full" shimmer />

      {/* Content Skeleton */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex gap-3">
          {/* Avatar Skeleton */}
          <Skeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0" shimmer />

          {/* Info Skeleton */}
          <div className="flex-1 space-y-3 min-w-0">
            <Skeleton className="h-4 w-5/6" shimmer />
            <Skeleton className="h-3 w-4/5" shimmer />
            <div className="flex gap-2">
              <Skeleton className="h-2.5 w-16" shimmer />
              <Skeleton className="h-2.5 w-12" shimmer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VideoPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Video Player Skeleton */}
      <Skeleton className="w-full aspect-video rounded-xl" />

      {/* Title Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Channel Info Skeleton */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
