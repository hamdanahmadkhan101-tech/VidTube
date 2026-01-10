import httpClient from "./httpClient.js";

/**
 * Report a video or comment
 * @param {Object} data - { type, reportedItem, reason, description }
 * @returns {Promise}
 */
export const createReport = (data) => httpClient.post("/reports", data);

/**
 * Get user's reports (optional)
 * @returns {Promise}
 */
export const getMyReports = () => httpClient.get("/reports/me");
