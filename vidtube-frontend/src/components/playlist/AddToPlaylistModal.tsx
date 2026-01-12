import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, Loader2 } from "lucide-react";
import { playlistService } from "../../services/playlistService.ts";
import type { Playlist } from "../../types";
import toast from "react-hot-toast";

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  userId: string;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  videoId,
  userId,
}) => {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["userPlaylists"],
    queryFn: () => playlistService.getUserPlaylists(),
    enabled: isOpen,
  });

  const createPlaylistMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      playlistService.createPlaylist(data),
    onSuccess: (newPlaylist) => {
      toast.success("Playlist created!");
      queryClient.invalidateQueries({ queryKey: ["userPlaylists"] });
      setShowCreateForm(false);
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      // Auto-add video to new playlist
      addToPlaylistMutation.mutate(newPlaylist._id);
    },
    onError: () => {
      toast.error("Failed to create playlist");
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: (playlistId: string) =>
      playlistService.addVideoToPlaylist(playlistId, videoId),
    onSuccess: () => {
      toast.success("Added to playlist!");
      queryClient.invalidateQueries({ queryKey: ["userPlaylists"] });
    },
    onError: () => {
      toast.error("Failed to add to playlist");
    },
  });

  const removeFromPlaylistMutation = useMutation({
    mutationFn: (playlistId: string) =>
      playlistService.removeVideoFromPlaylist(playlistId, videoId),
    onSuccess: () => {
      toast.success("Removed from playlist");
      queryClient.invalidateQueries({ queryKey: ["userPlaylists"] });
    },
  });

  const playlists = data || [];

  // Simplified modal for mobile
  const ModalWrapper = isMobile ? 'div' : motion.div;
  const modalProps = isMobile
    ? { className: "fixed inset-0 z-50 flex items-center justify-center p-4" }
    : {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {isMobile ? (
            <div
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
          )}

          {/* Modal */}
          <ModalWrapper {...modalProps}>
            <div className="glass-card w-full max-w-md max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-text-primary">
                  Save to playlist
                </h2>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlists.map((playlist: Playlist) => {
                      const isInPlaylist = playlist.videos.some(
                        (v: any) => v._id === videoId
                      );

                      return (
                        <button
                          key={playlist._id}
                          onClick={() => {
                            if (isInPlaylist) {
                              removeFromPlaylistMutation.mutate(playlist._id);
                            } else {
                              addToPlaylistMutation.mutate(playlist._id);
                            }
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isInPlaylist
                                ? "bg-primary-500 border-primary-500"
                                : "border-white/30"
                            }`}
                          >
                            {isInPlaylist && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-text-primary font-medium">
                              {playlist.name}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {playlist.videos.length} videos
                            </p>
                          </div>
                        </button>
                      );
                    })}

                    {playlists.length === 0 && !showCreateForm && (
                      <p className="text-center text-text-secondary py-8">
                        No playlists yet
                      </p>
                    )}
                  </div>
                )}

                {/* Create New Playlist */}
                {showCreateForm ? (
                  <div className="mt-4 p-4 glass-card rounded-xl">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Playlist name"
                      className="glass-input w-full mb-3"
                      autoFocus
                    />
                    <textarea
                      value={newPlaylistDescription}
                      onChange={(e) =>
                        setNewPlaylistDescription(e.target.value)
                      }
                      placeholder="Description (optional)"
                      className="glass-input w-full h-20 resize-none mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (newPlaylistName.trim()) {
                            createPlaylistMutation.mutate({
                              name: newPlaylistName,
                              description: newPlaylistDescription,
                            });
                          }
                        }}
                        disabled={
                          !newPlaylistName.trim() ||
                          createPlaylistMutation.isPending
                        }
                        className="btn-primary flex-1"
                      >
                        {createPlaylistMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Create"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewPlaylistName("");
                          setNewPlaylistDescription("");
                        }}
                        className="btn-ghost"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-3 p-3 mt-4 rounded-lg hover:bg-surface transition-colors border border-white/10"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary-500" />
                    </div>
                    <span className="text-text-primary font-medium">
                      Create new playlist
                    </span>
                  </button>
                )}
              </div>
            </div>
          </ModalWrapper>
        </>
      )}
    </AnimatePresence>
  );
};
