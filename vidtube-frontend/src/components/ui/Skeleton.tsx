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
        className
      )}
    />
  );
};

export const VideoCardSkeleton: React.FC = () => {
  return (
    <div className="bento-item">
      {/* Thumbnail Skeleton */}
      <Skeleton className="aspect-video rounded-t-2xl" />

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar Skeleton */}
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />

          {/* Info Skeleton */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
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
