import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Play, Lock, Users, Trash2, Loader2 } from "lucide-react";
import { playlistService } from "../services/playlistService";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export const PlaylistsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [newPlaylistPrivacy, setNewPlaylistPrivacy] = useState<
    "public" | "private"
  >("public");

  const { data: playlists, isLoading } = useQuery({
    queryKey: ["userPlaylists"],
    queryFn: () => playlistService.getUserPlaylists(),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      privacy: "public" | "private";
    }) => playlistService.createPlaylist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPlaylists"] });
      setShowCreateModal(false);
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      toast.success("Playlist created successfully!");
    },
    onError: () => {
      toast.error("Failed to create playlist");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (playlistId: string) =>
      playlistService.deletePlaylist(playlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPlaylists"] });
      toast.success("Playlist deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete playlist");
    },
  });

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    createMutation.mutate({
      name: newPlaylistName,
      description: newPlaylistDescription || undefined,
      privacy: newPlaylistPrivacy,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">My Playlists</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Playlist
        </button>
      </div>

      {playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <motion.div
              key={playlist._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 hover:shadow-glow transition-all"
            >
              <Link to={`/playlist/${playlist._id}`}>
                <div className="aspect-video bg-linear-to-br from-primary-500 to-accent-blue rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  {playlist.thumbnailUrl ? (
                    <img
                      src={playlist.thumbnailUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Play className="w-12 h-12 text-white" />
                  )}
                </div>
              </Link>

              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {playlist.name}
              </h3>

              {playlist.description && (
                <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                  {playlist.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-text-tertiary mb-4">
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
                <span>{playlist.videos?.length || 0} videos</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/playlist/${playlist._id}`}
                  className="btn-ghost flex-1 text-center"
                >
                  View
                </Link>
                <button
                  onClick={() => deleteMutation.mutate(playlist._id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Play className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            No playlists yet
          </h3>
          <p className="text-text-secondary mb-6">
            Create your first playlist to organize your favorite videos
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Playlist
          </button>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Create New Playlist
            </h2>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="glass-input w-full"
                  placeholder="Enter playlist name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="glass-input w-full h-24 resize-none"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Privacy
                </label>
                <select
                  value={newPlaylistPrivacy}
                  onChange={(e) =>
                    setNewPlaylistPrivacy(
                      e.target.value as "public" | "private",
                    )
                  }
                  className="glass-input w-full"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || !newPlaylistName.trim()}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
