import httpClient from "./httpClient.js";

/**
 * Get user's watch history
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise}
 */
export const getWatchHistory = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const query = queryParams.toString();
  const response = await httpClient.get(
    `/users/watch-history${query ? `?${query}` : ""}`
  );

  // Transform backend response to expected format
  const data = response.data.data;
  return {
    ...response,
    data: {
      ...response.data,
      data: {
        docs: data.videos || [],
        hasNextPage: data.pagination?.hasNextPage || false,
        hasPrevPage: data.pagination?.hasPrevPage || false,
        totalDocs: data.pagination?.totalVideos || 0,
        page: data.pagination?.currentPage || 1,
        totalPages: data.pagination?.totalPages || 0,
      },
    },
  };
};

/**
 * Add video to watch history
 * @param {string} videoId - Video ID
 * @returns {Promise}
 */
export const addToWatchHistory = (videoId) =>
  httpClient.post(`/videos/${videoId}/watch`);

/**
 * Clear all watch history
 * NOTE: This endpoint may not be implemented on backend yet
 * @returns {Promise}
 */
export const clearWatchHistory = () =>
  httpClient.delete("/users/watch-history").catch((err) => {
    // If endpoint doesn't exist, clear local progress instead
    if (err.response?.status === 404) {
      localStorage.removeItem("videoProgress");
      return { data: { success: true, message: "Local history cleared" } };
    }
    throw err;
  });

/**
 * Remove single video from history
 * NOTE: This endpoint may not be implemented on backend yet
 * @param {string} videoId - Video ID
 * @returns {Promise}
 */
export const removeFromHistory = (videoId) =>
  httpClient.delete(`/users/watch-history/${videoId}`).catch((err) => {
    // If endpoint doesn't exist, just clear local progress
    if (err.response?.status === 404) {
      clearVideoProgress(videoId);
      return { data: { success: true, message: "Removed from local history" } };
    }
    throw err;
  });

/**
 * Save video progress for resume functionality
 * @param {string} videoId - Video ID
 * @param {number} currentTime - Current playback time in seconds
 * @param {number} duration - Total video duration in seconds
 */
export const saveVideoProgress = (videoId, currentTime, duration) => {
  const progress = {
    currentTime,
    duration,
    percentage: duration > 0 ? (currentTime / duration) * 100 : 0,
    updatedAt: new Date().toISOString(),
  };

  // Store progress locally
  const progressData = JSON.parse(
    localStorage.getItem("videoProgress") || "{}"
  );
  progressData[videoId] = progress;
  localStorage.setItem("videoProgress", JSON.stringify(progressData));

  return progress;
};

/**
 * Get saved video progress
 * @param {string} videoId - Video ID
 * @returns {Object|null} Progress data or null
 */
export const getVideoProgress = (videoId) => {
  const progressData = JSON.parse(
    localStorage.getItem("videoProgress") || "{}"
  );
  return progressData[videoId] || null;
};

/**
 * Clear saved progress for a video
 * @param {string} videoId - Video ID
 */
export const clearVideoProgress = (videoId) => {
  const progressData = JSON.parse(
    localStorage.getItem("videoProgress") || "{}"
  );
  delete progressData[videoId];
  localStorage.setItem("videoProgress", JSON.stringify(progressData));
};
