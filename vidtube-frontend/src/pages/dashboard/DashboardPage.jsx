import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  Eye,
  ThumbsUp,
  MessageCircle,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Header from "../../components/layout/Header.jsx";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard.jsx";
import Button from "../../components/ui/Button.jsx";
import ProtectedRoute from "../../components/common/ProtectedRoute.jsx";
import { getAllVideos } from "../../services/videoService.js";
import { getVideosByUserId } from "../../services/videoService.js";
import useAuth from "../../hooks/useAuth.js";

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSubscribers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        // Fetch user's videos to calculate stats
        const response = await getVideosByUserId(user._id, { limit: 100 });
        const videos = response.data.data || [];

        const totalVideos = videos.length;
        const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
        const totalLikes = videos.reduce(
          (sum, v) => sum + (v.likesCount || 0),
          0
        );
        const totalComments = videos.reduce(
          (sum, v) => sum + (v.commentsCount || 0),
          0
        );

        setStats({
          totalVideos,
          totalViews,
          totalLikes,
          totalComments,
          totalSubscribers: 0, // Would need separate API call
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-textSecondary">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-textSecondary">
                Welcome back, {user?.fullName || user?.username}!
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/upload">
                <Button>Upload Video</Button>
              </Link>
              <Link to={`/channel/${user?.username || user?._id}`}>
                <Button variant="outline">View Channel</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Total Videos"
            value={stats.totalVideos}
            icon={Video}
            formatValue={formatNumber}
          />
          <AnalyticsCard
            title="Total Views"
            value={stats.totalViews}
            icon={Eye}
            formatValue={formatNumber}
          />
          <AnalyticsCard
            title="Total Likes"
            value={stats.totalLikes}
            icon={ThumbsUp}
            formatValue={formatNumber}
          />
          <AnalyticsCard
            title="Total Comments"
            value={stats.totalComments}
            icon={MessageCircle}
            formatValue={formatNumber}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/upload"
            className="rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-lg group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Upload Video
                </h3>
                <p className="text-sm text-textSecondary">
                  Share your content with the world
                </p>
              </div>
            </div>
          </Link>

          <Link
            to={`/channel/${user?.username || user?._id}`}
            className="rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-lg group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  My Channel
                </h3>
                <p className="text-sm text-textSecondary">
                  Manage your channel and videos
                </p>
              </div>
            </div>
          </Link>

          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Analytics
                </h3>
                <p className="text-sm text-textSecondary">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
