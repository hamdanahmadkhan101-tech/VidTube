import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header.jsx";
import VideoPlayer from "../../components/video/VideoPlayer.jsx";
import VideoGrid from "../../components/video/VideoGrid.jsx";
import VideoInfo from "../../components/video/VideoInfo.jsx";
import VideoActions from "../../components/video/VideoActions.jsx";
import OwnerSection from "../../components/video/OwnerSection.jsx";
import CommentSection from "../../components/social/CommentSection.jsx";
import { VideoDetailSkeleton } from "../../components/common/LoadingSkeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import {
  getVideoById,
  getAllVideos,
} from "../../services/videoService.js";
import useAuth from "../../hooks/useAuth.js";
import { handleApiError } from "../../utils/apiErrorHandler.js";
import { useVideoStore } from "../../store/index.js";

export default function VideoDetailPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const getCachedVideo = useVideoStore((state) => state.getCachedVideo);
  const cacheVideo = useVideoStore((state) => state.cacheVideo);
  const setCurrentVideo = useVideoStore((state) => state.setCurrentVideo);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cached = getCachedVideo(videoId);
        if (cached) {
          setVideo(cached);
          setCurrentVideo(cached);
          setLoading(false);
          return;
        }

        const response = await getVideoById(videoId);
        const videoData = response.data.data;
        setVideo(videoData);
        setCurrentVideo(videoData);
        
        // Cache the video
        cacheVideo(videoId, videoData);
      } catch (error) {
        handleApiError(error, { defaultMessage: "Failed to load video" });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, navigate, getCachedVideo, cacheVideo, setCurrentVideo]);

  useEffect(() => {
    const fetchRelatedVideos = async () => {
      if (!video) return;
      
      try {
        setRelatedLoading(true);
        const response = await getAllVideos({
          limit: 8,
          sortBy: "createdAt",
          sortType: "desc",
        });
        const filtered = (response.data.data.docs || []).filter(
          (v) => v._id !== videoId
        );
        setRelatedVideos(filtered.slice(0, 8));
      } catch (error) {
        // Silently fail for related videos - not critical
        console.error('Failed to load related videos:', error);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedVideos();
  }, [video, videoId]);

  const handleVideoUpdate = (updates) => {
    setVideo((prev) => prev ? { ...prev, ...updates } : null);
  };

  const isOwner =
    isAuthenticated && user && video && video.owner?._id === user._id;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <VideoDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <EmptyState
            title="Video Not Found"
            message="The video you're looking for doesn't exist or has been removed."
            actionLabel="Go Home"
            actionPath="/"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
              <VideoPlayer 
                videoUrl={video.url} 
                poster={video.thumbnailUrl} 
                title={video.title}
                autoPlay={false}
              />
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <VideoInfo video={video} />
                </div>
              </div>

              {/* Action Buttons */}
              <VideoActions
                videoId={videoId}
                video={video}
                isOwner={isOwner}
                onVideoUpdate={handleVideoUpdate}
              />

              {/* Owner Info */}
              <OwnerSection video={video} isOwner={isOwner} />

              {/* Description */}
              {video.description && (
                <div className="bg-surface rounded-lg p-4">
                  <p className="text-white whitespace-pre-wrap">
                    {video.description}
                  </p>
                </div>
              )}

              {/* Comments Section */}
              <CommentSection videoId={videoId} />
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-white mb-4">
              Related Videos
            </h2>
            <VideoGrid
              videos={relatedVideos}
              loading={relatedLoading}
              emptyMessage="No related videos"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
