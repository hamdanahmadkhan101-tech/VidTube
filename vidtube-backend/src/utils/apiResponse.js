/**
 * Standardized API Response Class
 * Ensures consistent response format across all endpoints
 */
class apiResponse {
  constructor(statusCode = 200, message = 'Success', data = null, meta = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.error = null;
    
    // Add metadata for paginated responses
    if (meta) {
      this.meta = meta;
    }
  }

  /**
   * Create a paginated response
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Response message
   * @param {Object} paginatedData - Pagination data from mongoose-aggregate-paginate
   * @returns {apiResponse}
   */
  static paginated(statusCode, message, paginatedData) {
    const { docs, totalDocs, limit, page, totalPages, hasNextPage, hasPrevPage } =
      paginatedData || {};

    return new apiResponse(statusCode, message, docs || [], {
      pagination: {
        page: page || 1,
        limit: limit || 10,
        total: totalDocs || 0,
        totalPages: totalPages || 0,
        hasNextPage: hasNextPage || false,
        hasPrevPage: hasPrevPage || false,
      },
    });
  }
}

export default apiResponse;