import { create } from 'zustand';

/**
 * Video Store using Zustand
 * Manages video-related global state (cache, favorites, etc.)
 */

const useVideoStore = create((set, get) => ({
  // State
  videos: [],
  currentVideo: null,
  searchQuery: '',
  filters: {
    sortBy: 'createdAt',
    sortType: 'desc',
    category: null,
  },
  pagination: {
    page: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
    total: 0,
  },
  loading: false,
  error: null,
  // Cache for video details
  videoCache: new Map(),

  // Actions
  setVideos: (videos) => set({ videos }),

  setCurrentVideo: (video) => set({ currentVideo: video }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  // Cache video in memory
  cacheVideo: (videoId, videoData) => {
    const { videoCache } = get();
    const newCache = new Map(videoCache);
    newCache.set(videoId, {
      ...videoData,
      cachedAt: Date.now(),
    });
    set({ videoCache: newCache });
  },

  // Get cached video
  getCachedVideo: (videoId) => {
    const { videoCache } = get();
    const cached = videoCache.get(videoId);
    if (cached && Date.now() - cached.cachedAt < 5 * 60 * 1000) {
      // Cache valid for 5 minutes
      return cached;
    }
    return null;
  },

  // Clear cache
  clearCache: () => set({ videoCache: new Map() }),

  // Reset video state
  reset: () =>
    set({
      videos: [],
      currentVideo: null,
      searchQuery: '',
      filters: {
        sortBy: 'createdAt',
        sortType: 'desc',
        category: null,
      },
      pagination: {
        page: 1,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false,
        total: 0,
      },
      loading: false,
      error: null,
    }),
}));

export default useVideoStore;
