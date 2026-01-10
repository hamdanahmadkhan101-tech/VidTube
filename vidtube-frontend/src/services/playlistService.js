import httpClient from "./httpClient.js";

/**
 * Create a new playlist
 * @param {Object} data - { name, description, isPublic }
 * @returns {Promise}
 */
export const createPlaylist = (data) => httpClient.post("/playlists", data);

/**
 * Get user's playlists
 * @param {string} userId
 * @param {Object} params - { page, limit }
 * @returns {Promise}
 */
export const getUserPlaylists = (userId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  return httpClient.get(`/playlists/user/${userId}?${queryParams.toString()}`);
};

/**
 * Get playlist by ID
 * @param {string} playlistId
 * @returns {Promise}
 */
export const getPlaylistById = (playlistId) =>
  httpClient.get(`/playlists/${playlistId}`);

/**
 * Update a playlist
 * @param {string} playlistId
 * @param {Object} data - { name, description, isPublic }
 * @returns {Promise}
 */
export const updatePlaylist = (playlistId, data) =>
  httpClient.patch(`/playlists/${playlistId}`, data);

/**
 * Delete a playlist
 * @param {string} playlistId
 * @returns {Promise}
 */
export const deletePlaylist = (playlistId) =>
  httpClient.delete(`/playlists/${playlistId}`);

/**
 * Add video to playlist
 * @param {string} playlistId
 * @param {string} videoId
 * @returns {Promise}
 */
export const addVideoToPlaylist = (playlistId, videoId) =>
  httpClient.post(`/playlists/${playlistId}/videos/${videoId}`);

/**
 * Remove video from playlist
 * @param {string} playlistId
 * @param {string} videoId
 * @returns {Promise}
 */
export const removeVideoFromPlaylist = (playlistId, videoId) =>
  httpClient.delete(`/playlists/${playlistId}/videos/${videoId}`);
