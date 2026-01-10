/**
 * Data Formatting Utilities
 * Centralized data transformation functions
 */

/**
 * Format pagination response from mongoose-aggregate-paginate
 * @param {Object} paginatedData - Data from aggregatePaginate
 * @returns {Object} Formatted pagination metadata
 */
export const formatPaginationMeta = (paginatedData) => {
  const {
    docs,
    totalDocs,
    limit,
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  } = paginatedData || {};

  return {
    pagination: {
      page: page || 1,
      limit: limit || 10,
      total: totalDocs || 0,
      totalPages: totalPages || 0,
      hasNextPage: hasNextPage || false,
      hasPrevPage: hasPrevPage || false,
      nextPage: nextPage || null,
      prevPage: prevPage || null,
    },
  };
};

/**
 * Sanitize user object - remove sensitive fields
 * @param {Object} user - User document
 * @returns {Object} Sanitized user object
 */
export const sanitizeUser = (user) => {
  if (!user) return null;

  const userObj = user.toObject ? user.toObject() : user;
  const { password, refreshTokens, __v, ...sanitized } = userObj;
  return sanitized;
};

/**
 * Format video object with computed fields
 * @param {Object} video - Video document
 * @returns {Object} Formatted video object
 */
export const formatVideo = (video) => {
  if (!video) return null;

  const videoObj = video.toObject ? video.toObject() : video;
  
  // Ensure numeric fields are properly typed
  return {
    ...videoObj,
    views: Number(videoObj.views || 0),
    duration: Number(videoObj.duration || 0),
    likesCount: Number(videoObj.likesCount || 0),
    commentsCount: Number(videoObj.commentsCount || 0),
  };
};
