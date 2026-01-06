import VideoCard from './VideoCard.jsx';

export default function VideoGrid({ videos, loading, error, emptyMessage = 'No videos found' }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="w-full aspect-video bg-surface rounded-lg mb-3"></div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-light"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-light rounded w-3/4"></div>
                <div className="h-3 bg-surface-light rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-6xl mb-4">📹</div>
        <p className="text-textSecondary text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {videos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  );
}

