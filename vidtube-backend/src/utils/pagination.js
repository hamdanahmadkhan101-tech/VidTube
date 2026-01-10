/**
 * Pagination Utilities
 * Centralized pagination parameter handling
 */

/**
 * Validate and normalize pagination parameters
 * @param {Object} query - Express request query object
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const getPaginationParams = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  let limit = parseInt(query.limit, 10) || 10;

  // Enforce maximum items per page for performance
  if (limit > 50) limit = 50;
  if (limit < 1) limit = 1;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Validate sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortType - 'asc' or 'desc'
 * @param {Array<string>} allowedFields - Allowed fields to sort by
 * @returns {{ sortBy: string, sortType: 1 | -1 }}
 */
export const getSortParams = (sortBy, sortType, allowedFields = []) => {
  // Validate sortBy is in allowed fields if provided
  const validSortBy =
    allowedFields.length > 0 && allowedFields.includes(sortBy)
      ? sortBy
      : allowedFields.length > 0
        ? allowedFields[0]
        : sortBy || 'createdAt';

  const validSortType = sortType === 'asc' ? 1 : -1;

  return {
    sortBy: validSortBy,
    sortType: validSortType,
    sortStage: { [validSortBy]: validSortType },
  };
};
