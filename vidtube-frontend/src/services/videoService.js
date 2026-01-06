import httpClient from './httpClient.js';

/**
 * Upload a video with thumbnail
 * @param {FormData} formData - FormData containing video, thumbnail, title, description, duration, videoformat
 * @param {Function} onUploadProgress - Callback for upload progress
 * @returns {Promise}
 */
export const uploadVideo = (formData, onUploadProgress) =>
  httpClient.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });

/**
 * Get all videos with pagination
 * @param {Object} params - Query parameters (page, limit, sortBy, sortType)
 * @returns {Promise}
 */
export const getAllVideos = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortType) queryParams.append('sortType', params.sortType);

  return httpClient.get(`/videos?${queryParams.toString()}`);
};

/**
 * Get a single video by ID
 * @param {string} videoId - Video ID
 * @returns {Promise}
 */
export const getVideoById = (videoId) =>
  httpClient.get(`/videos/${videoId}`);

/**
 * Search videos
 * @param {string} query - Search query
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise}
 */
export const searchVideos = (query, params = {}) => {
  const queryParams = new URLSearchParams({ query });
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  return httpClient.get(`/videos/search?${queryParams.toString()}`);
};

/**
 * Get videos by user ID
 * @param {string} userId - User ID
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise}
 */
export const getVideosByUserId = (userId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  return httpClient.get(`/videos/user/${userId}?${queryParams.toString()}`);
};

/**
 * Update video details
 * @param {string} videoId - Video ID
 * @param {FormData} formData - FormData containing title, description, optional thumbnail
 * @returns {Promise}
 */
export const updateVideo = (videoId, formData) =>
  httpClient.patch(`/videos/${videoId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Delete a video
 * @param {string} videoId - Video ID
 * @returns {Promise}
 */
export const deleteVideo = (videoId) =>
  httpClient.delete(`/videos/${videoId}`);

/**
 * Toggle video publish status
 * @param {string} videoId - Video ID
 * @returns {Promise}
 */
export const togglePublishStatus = (videoId) =>
  httpClient.patch(`/videos/toggle/publish/${videoId}`);

/**
 * Add video to watch history
 * @param {string} videoId - Video ID
 * @returns {Promise}
 */
export const addToWatchHistory = (videoId) =>
  httpClient.post(`/videos/${videoId}/watch`);

