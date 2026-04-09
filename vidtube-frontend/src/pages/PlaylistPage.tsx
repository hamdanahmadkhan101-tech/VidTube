import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, Lock, Users, Calendar, Loader2 } from "lucide-react";
import { playlistService } from "../services/playlistService.ts";
import { VideoCard } from "../components/video/VideoCard";
import { formatRelativeTime } from "../utils/helpers";
import type { PlaylistVideo, Video } from "../types";

export const PlaylistPage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();

  const { data: playlist, isLoading } = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: () => playlistService.getPlaylistById(playlistId!),
    enabled: !!playlistId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Playlist Not Found
          </h2>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Extract video objects from playlist items
  const videos: Video[] = playlist.videos.flatMap((item: PlaylistVideo) => {
    const video = typeof item.video === "object" ? item.video : null;
    return video ? [video] : [];
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Playlist Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-24">
            <div className="aspect-video bg-linear-to-br from-primary-500 to-accent-blue rounded-xl mb-4 flex items-center justify-center">
              <Play className="w-16 h-16 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {playlist.name}
            </h1>

            <Link
              to={`/channel/${playlist.owner.username}`}
              className="flex items-center gap-2 mb-4 hover:text-primary-500 transition-colors"
            >
              <img
                src={playlist.owner.avatarUrl || "/default-avatar.jpg"}
                alt={playlist.owner.fullName}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-text-secondary">
                {playlist.owner.fullName}
              </span>
            </Link>

            {playlist.description && (
              <p className="text-text-secondary mb-4 whitespace-pre-wrap">
                {playlist.description}
              </p>
            )}

            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>{videos.length} videos</span>
              </div>
              <div className="flex items-center gap-2">
                {playlist.isPublic === false ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                <span>
                  {playlist.isPublic === false ? "Private" : "Public"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Updated {formatRelativeTime(playlist.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Videos</h2>

          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-visible">
              {videos.map((video) => (
                <div key={video._id} className="overflow-visible">
                  <VideoCard video={video} />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <Play className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No videos in this playlist
              </h3>
              <p className="text-text-secondary">
                Videos will appear here when added
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistPage;
