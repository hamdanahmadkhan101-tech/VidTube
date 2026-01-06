import httpClient from './httpClient.js';

/**
 * Get user channel profile by username
 * @param {string} username - Username
 * @returns {Promise}
 */
export const getUserChannelProfile = (username) =>
  httpClient.get(`/users/c/${username}`);

