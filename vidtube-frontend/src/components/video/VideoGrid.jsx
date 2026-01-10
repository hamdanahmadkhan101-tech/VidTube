import VideoCard from './VideoCard.jsx';
import { VideoGridSkeleton } from '../common/LoadingSkeleton.jsx';
import { EmptyVideoList } from '../common/EmptyState.jsx';
import { handleApiError } from '../../utils/apiErrorHandler.js';

export default function VideoGrid({ videos, loading, error, emptyMessage = 'No videos found' }) {
  if (loading) {
    return <VideoGridSkeleton count={12} />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-red-500 text-lg font-semibold mb-2">Error loading videos</div>
        <p className="text-textSecondary text-sm">{error}</p>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return <EmptyVideoList message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  );
}

