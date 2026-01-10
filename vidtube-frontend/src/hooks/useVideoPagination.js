import { useState, useCallback, useEffect } from "react";
import { useVideoStore } from "../store/index.js";
import { getAllVideos } from "../services/videoService.js";
import toast from "react-hot-toast";

/**
 * Video Pagination Hook
 * Handles fetching and pagination of videos
 * @param {Object} options - { initialPage, initialLimit, sortBy, sortType, autoFetch }
 * @returns {Object} Pagination state and controls
 */
export default function useVideoPagination(options = {}) {
  const {
    initialPage = 1,
    initialLimit = 10,
    sortBy = "createdAt",
    sortType = "desc",
    autoFetch = true,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const videos = useVideoStore((state) => state.videos);
  const setVideos = useVideoStore((state) => state.setVideos);
  const setPagination = useVideoStore((state) => state.setPagination);
  const setLoading = useVideoStore((state) => state.setLoading);
  const setError = useVideoStore((state) => state.setError);
  const loading = useVideoStore((state) => state.loading);
  const error = useVideoStore((state) => state.error);
  const pagination = useVideoStore((state) => state.pagination);

  const fetchVideos = useCallback(
    async (pageNum = page, sortByParam = sortBy, sortTypeParam = sortType) => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAllVideos({
          page: pageNum,
          limit,
          sortBy: sortByParam,
          sortType: sortTypeParam,
        });

        if (response.data.success) {
          const docs = response.data.data || [];
          const paginationData = response.data.meta?.pagination || {};
          setVideos(docs);
          setPagination({
            page: paginationData.page || pageNum,
            limit: paginationData.limit || limit,
            hasNextPage: paginationData.hasNextPage || false,
            hasPrevPage: paginationData.hasPrevPage || false,
            total: paginationData.total || 0,
            totalPages: paginationData.totalPages || 0,
          });
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Failed to fetch videos";
        setError(errorMessage);
        // Only show toast on non-initial page loads (page > 1 or manual refresh)
        if (pageNum > 1) {
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [limit, setVideos, setPagination, setLoading, setError] // Remove page, sortBy, sortType from deps - they're passed as params
  );

  useEffect(() => {
    if (autoFetch) {
      fetchVideos(initialPage, sortBy, sortType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only run once if autoFetch is true

  const goToPage = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
        setPage(newPage);
        fetchVideos(newPage);
      }
    },
    [pagination.totalPages, fetchVideos]
  );

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      const newPage = page + 1;
      setPage(newPage);
      fetchVideos(newPage);
    }
  }, [page, pagination.hasNextPage, fetchVideos]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      const newPage = page - 1;
      setPage(newPage);
      fetchVideos(newPage);
    }
  }, [page, pagination.hasPrevPage, fetchVideos]);

  const changeSort = useCallback(
    (newSortBy, newSortType) => {
      setPage(1);
      fetchVideos(1, newSortBy, newSortType);
    },
    [fetchVideos]
  );

  return {
    videos,
    loading,
    error,
    pagination: {
      ...pagination,
      currentPage: page,
    },
    page,
    fetchVideos,
    goToPage,
    nextPage,
    prevPage,
    changeSort,
    refetch: () => fetchVideos(page),
  };
}
