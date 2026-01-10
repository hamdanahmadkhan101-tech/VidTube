import React, { useState, useEffect } from "react";
import { X, Plus, Check } from "lucide-react";
import {
  createPlaylist,
  getUserPlaylists,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
} from "../../services/playlistService.js";
import { useAuthStore } from "../../store/index.js";

const PlaylistModal = ({ videoId, isOpen, onClose }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen && user) {
      fetchPlaylists();
    }
  }, [isOpen, user]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await getUserPlaylists(user._id);
      // We need to check if each playlist already contains this video
      setPlaylists(response.data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVideo = async (playlistId, isAlreadyIn) => {
    try {
      if (isAlreadyIn) {
        await removeVideoFromPlaylist(playlistId, videoId);
      } else {
        await addVideoToPlaylist(playlistId, videoId);
      }
      // Refresh to update UI
      fetchPlaylists();
    } catch (error) {
      alert("Error updating playlist");
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const response = await createPlaylist({
        name: newPlaylistName,
        isPublic: true,
      });
      // Add the video to the newly created playlist automatically
      await addVideoToPlaylist(response.data._id, videoId);
      setNewPlaylistName("");
      setIsCreating(false);
      fetchPlaylists();
    } catch (error) {
      alert("Error creating playlist");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 p-4">
          <h3 className="text-lg font-semibold text-white">Save to playlist</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : playlists.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-400">
              No playlists found
            </p>
          ) : (
            playlists.map((playlist) => {
              const hasVideo = playlist.videos?.includes(videoId);
              return (
                <button
                  key={playlist._id}
                  onClick={() => handleToggleVideo(playlist._id, hasVideo)}
                  className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-200">
                    {playlist.name}
                  </span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      hasVideo ? "bg-primary border-primary" : "border-gray-600"
                    }`}
                  >
                    {hasVideo && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-800 p-4">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              <span>Create new playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistModal;
