import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { User, Video, Eye, Calendar } from "lucide-react";
import Header from "../../components/layout/Header.jsx";
import VideoGrid from "../../components/video/VideoGrid.jsx";
import SubscribeButton from "../../components/social/SubscribeButton.jsx";
import Button from "../../components/ui/Button.jsx";
import { getVideosByUserId } from "../../services/videoService.js";
import { getUserChannelProfile } from "../../services/userService.js";
import useAuth from "../../hooks/useAuth.js";
import { toast } from "react-hot-toast";

export default function ChannelPage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [channelUser, setChannelUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    fetchChannelData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const fetchChannelData = async () => {
    try {
      setLoading(true);

      // Check if username is a valid ObjectId (userId)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(username);
      let targetUserId = null;
      let userData = null;

      if (isValidObjectId) {
        // If it's an ObjectId, use it directly as userId
        targetUserId = username;
        setUserId(username);
        // Try to fetch videos to get user info
        try {
          const videoResponse = await getVideosByUserId(username, {
            page: 1,
            limit: 1,
          });
          const videoData = videoResponse.data.data;
          if (videoData.docs && videoData.docs.length > 0) {
            userData = videoData.docs[0].owner;
            setChannelUser(userData);
          }
        } catch (err) {
          // Silently continue - will try username lookup next
        }
      } else {
        // If it's a username, get user profile first
        try {
          const userResponse = await getUserChannelProfile(username);
          userData = userResponse.data.data;
          targetUserId = userData._id;
          setChannelUser(userData);
          setUserId(targetUserId);
        } catch (err) {
          toast.error("Channel not found");
          setChannelUser(null);
          return;
        }
      }

      // Fetch videos if we have userId
      if (targetUserId) {
        await fetchVideos(1, targetUserId);
      }
    } catch (error) {
      toast.error("Failed to load channel");
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (pageNum = 1, targetUserId = userId) => {
    if (!targetUserId) return;

    try {
      setVideosLoading(true);
      const response = await getVideosByUserId(targetUserId, {
        page: pageNum,
        limit: 20,
      });
      const data = response.data.data;

      if (pageNum === 1) {
        setVideos(data.docs || []);
        setTotalVideos(data.totalDocs || 0);
        // Calculate total views
        const views = (data.docs || []).reduce(
          (sum, v) => sum + (v.views || 0),
          0
        );
        setTotalViews(views);
      } else {
        setVideos((prev) => [...prev, ...(data.docs || [])]);
        // Update total views
        const newViews = (data.docs || []).reduce(
          (sum, v) => sum + (v.views || 0),
          0
        );
        setTotalViews((prev) => prev + newViews);
      }

      setHasMore(data.hasNextPage || false);
      setPage(pageNum);
    } catch (error) {
      toast.error("Failed to load videos");
    } finally {
      setVideosLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!videosLoading && hasMore && userId) {
      fetchVideos(page + 1, userId);
    }
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-textSecondary">Loading channel...</p>
        </div>
      </div>
    );
  }

  if (!channelUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Channel not found</p>
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnChannel =
    currentUser &&
    channelUser &&
    (currentUser._id === channelUser._id ||
      currentUser.username === channelUser.username ||
      currentUser.username === username);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Channel Header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              {channelUser.avatarUrl ? (
                <img
                  src={channelUser.avatarUrl}
                  alt={channelUser.fullName || channelUser.username}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-border"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-4xl border-4 border-border">
                  {(channelUser.fullName || channelUser.username || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            {/* Channel Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {channelUser.fullName || channelUser.username}
              </h1>
              <p className="text-textSecondary mb-4">@{channelUser.username}</p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-textSecondary">
                  <Video className="h-5 w-5" />
                  <span className="font-medium">{totalVideos} videos</span>
                </div>
                <div className="flex items-center gap-2 text-textSecondary">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">
                    {formatViews(totalViews)} total views
                  </span>
                </div>
                {channelUser.createdAt && (
                  <div className="flex items-center gap-2 text-textSecondary">
                    <Calendar className="h-5 w-5" />
                    <span>
                      Joined{" "}
                      {new Date(channelUser.createdAt).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "long" }
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {isOwnChannel ? (
                <>
                  <Link to="/upload">
                    <Button>Upload Video</Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                </>
              ) : (
                channelUser._id && (
                  <SubscribeButton
                    channelId={channelUser._id}
                    channelUsername={channelUser.username}
                    initialIsSubscribed={channelUser.isSubscribed || false}
                    initialSubscribersCount={
                      channelUser.subscribersCount || 0
                    }
                    onSubscriptionChange={(isSubscribed, count) => {
                      setChannelUser((prev) => ({
                        ...prev,
                        isSubscribed,
                        subscribersCount: count,
                      }));
                    }}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-white mb-6">Videos</h2>

        <VideoGrid
          videos={videos}
          loading={videosLoading && page === 1}
          emptyMessage={`${
            channelUser.fullName || channelUser.username
          } hasn't uploaded any videos yet`}
        />

        {/* Load More */}
        {hasMore && !videosLoading && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={handleLoadMore}>
              Load More Videos
            </Button>
          </div>
        )}

        {videosLoading && page > 1 && (
          <div className="flex justify-center mt-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}
