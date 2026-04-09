import apiClient from "./apiClient";
import type { ApiResponse, Playlist } from "../types";

export const playlistService = {
  // Create playlist
  createPlaylist: async (data: {
    name: string;
    description?: string;
    privacy?: "public" | "private";
  }): Promise<Playlist> => {
    const payload = {
      name: data.name,
      description: data.description || "",
      isPublic: data.privacy !== "private",
    };
    const response = await apiClient.post<ApiResponse<Playlist>>(
      "/playlists",
      payload,
    );
    if (!response.data.data) {
      throw new Error("Failed to create playlist");
    }
    return response.data.data;
  },

  // Get user playlists
  getUserPlaylists: async (): Promise<Playlist[]> => {
    const response =
      await apiClient.get<ApiResponse<Playlist[]>>("/playlists/user");
    return response.data.data || [];
  },

  // Get playlist by ID
  getPlaylistById: async (playlistId: string): Promise<Playlist> => {
    const response = await apiClient.get<ApiResponse<Playlist>>(
      `/playlists/${playlistId}`,
    );
    if (!response.data.data) {
      throw new Error("Playlist not found");
    }
    return response.data.data;
  },

  // Update playlist
  updatePlaylist: async (
    playlistId: string,
    data: { name?: string; description?: string; isPublic?: boolean },
  ): Promise<Playlist> => {
    const response = await apiClient.patch<ApiResponse<Playlist>>(
      `/playlists/${playlistId}`,
      data,
    );
    if (!response.data.data) {
      throw new Error("Failed to update playlist");
    }
    return response.data.data;
  },

  // Delete playlist
  deletePlaylist: async (playlistId: string): Promise<void> => {
    await apiClient.delete(`/playlists/${playlistId}`);
  },

  // Add video to playlist
  addVideoToPlaylist: async (
    playlistId: string,
    videoId: string,
  ): Promise<Playlist> => {
    const response = await apiClient.post<ApiResponse<Playlist>>(
      `/playlists/${playlistId}/videos/${videoId}`,
    );
    if (!response.data.data) {
      throw new Error("Failed to add video to playlist");
    }
    return response.data.data;
  },

  // Remove video from playlist
  removeVideoFromPlaylist: async (
    playlistId: string,
    videoId: string,
  ): Promise<Playlist> => {
    const response = await apiClient.delete<ApiResponse<Playlist>>(
      `/playlists/${playlistId}/videos/${videoId}`,
    );
    if (!response.data.data) {
      throw new Error("Failed to remove video from playlist");
    }
    return response.data.data;
  },
};
