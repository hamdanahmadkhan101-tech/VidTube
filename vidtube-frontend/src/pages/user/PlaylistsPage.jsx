import { useState, useEffect, useCallback } from "react";
import Header from "../../components/layout/Header.jsx";
import ProtectedRoute from "../../components/common/ProtectedRoute.jsx";
import {
  ListMusic,
  Plus,
  MoreVertical,
  Trash2,
  Lock,
  Globe,
} from "lucide-react";
import {
  getUserPlaylists,
  createPlaylist,
  deletePlaylist,
} from "../../services/playlistService.js";
import useAuth from "../../hooks/useAuth.js";
import Button from "../../components/ui/Button.jsx";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { EmptyState } from "../../components/common/EmptyState.jsx";

function PlaylistsContent() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    name: "",
    description: "",
    isPublic: true,
  });

  const fetchPlaylists = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const response = await getUserPlaylists(user._id);
      if (response.data.success) {
        setPlaylists(response.data.data.playlists || []);
      }
    } catch (error) {
      toast.error("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylist.name.trim()) return;

    try {
      const response = await createPlaylist(newPlaylist);
      if (response.data.success) {
        setPlaylists((prev) => [response.data.data, ...prev]);
        setShowCreateModal(false);
        setNewPlaylist({ name: "", description: "", isPublic: true });
        toast.success("Playlist created");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create playlist");
    }
  };

  const handleDeletePlaylist = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this playlist?"))
      return;

    try {
      await deletePlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p._id !== id));
      toast.success("Playlist deleted");
    } catch (error) {
      toast.error("Failed to delete playlist");
    }
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ListMusic className="h-8 w-8 text-primary" />
            My Playlists
          </h1>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Playlist
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="aspect-video w-full animate-pulse bg-surface rounded-xl border border-border"
              ></div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <EmptyState
            icon={ListMusic}
            title="No Playlists"
            message="You haven't created any playlists yet. Organize your favorite videos into collections."
            actionLabel="Create Your First Playlist"
            actionOnClick={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <Link
                key={playlist._id}
                to={`/playlist/${playlist._id}`}
                className="group relative flex flex-col bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all"
              >
                <div className="aspect-video bg-zinc-800 flex items-center justify-center relative">
                  {playlist.videos && playlist.videos.length > 0 ? (
                    <>
                      <img
                        src={
                          playlist.videos[0].video?.thumbnailUrl ||
                          playlist.thumbnailUrl
                        }
                        alt={playlist.name}
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                        <ListMusic className="h-10 w-10 mb-2" />
                        <span className="text-lg font-bold">
                          {playlist.videos.length} videos
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <ListMusic className="h-12 w-12 mb-2" />
                      <span>Empty</span>
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 p-1 bg-black/60 rounded-md backdrop-blur-sm">
                    {playlist.isPublic ? (
                      <Globe className="h-3 w-3" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                  </div>
                </div>

                <div className="p-4 flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {playlist.name}
                    </h3>
                    <p className="text-xs text-textSecondary line-clamp-1 mt-1">
                      {playlist.description || "No description"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeletePlaylist(playlist._id, e)}
                    className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Create New Playlist</h2>
              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={newPlaylist.name}
                    onChange={(e) =>
                      setNewPlaylist((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full bg-zinc-900 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none"
                    placeholder="Enter playlist name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={newPlaylist.description}
                    onChange={(e) =>
                      setNewPlaylist((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full bg-zinc-900 border border-border rounded-lg px-4 py-2 focus:border-primary outline-none resize-none"
                    placeholder="What is this playlist about?"
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newPlaylist.isPublic}
                    onChange={(e) =>
                      setNewPlaylist((prev) => ({
                        ...prev,
                        isPublic: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor="isPublic"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Public Playlist
                    <span className="block text-xs text-zinc-500 font-normal">
                      Anyone can see and search for this playlist
                    </span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PlaylistsPage() {
  return (
    <ProtectedRoute>
      <PlaylistsContent />
    </ProtectedRoute>
  );
}
