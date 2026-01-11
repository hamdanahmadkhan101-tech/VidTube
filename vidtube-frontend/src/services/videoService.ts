import apiClient from "./apiClient";
import type {
  ApiResponse,
  PaginatedResponse,
  Video,
  VideoFilters,
  SearchParams,
  UploadVideoFormData,
} from "../types";

// Helper to map backend response to frontend Video type
const mapVideoResponse = (video: any): Video => ({
  ...video,
  videoUrl: video.url || video.videoUrl,
  likes: video.likesCount ?? video.likes ?? 0,
  views: video.views ?? 0,
  owner: video.owner
    ? {
        ...video.owner,
        subscribersCount: video.owner.subscribersCount ?? 0,
      }
    : video.owner,
});

export const videoService = {
  // Get all videos with pagination and filters
  getVideos: async (
    filters?: VideoFilters
  ): Promise<PaginatedResponse<Video>> => {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortType) params.append("sortType", filters.sortType);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.tags) params.append("tags", filters.tags.join(","));

    const response = await apiClient.get<ApiResponse<Video[]>>(
      `/videos?${params.toString()}`
    );

    // Backend returns { data: [...videos], meta: { pagination: {...} } }
    const videos = (response.data.data || []).map(mapVideoResponse);
    return {
      docs: videos,
      pagination: (response.data as any).meta?.pagination || {
        page: 1,
        limit: 20,
        totalDocs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  // Get video by ID
  getVideoById: async (videoId: string): Promise<Video> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/videos/${videoId}`
    );
    if (!response.data.data) {
      throw new Error("Video not found");
    }
    return mapVideoResponse(response.data.data);
  },

  // Search videos
  searchVideos: async (
    searchParams: SearchParams
  ): Promise<PaginatedResponse<Video>> => {
    const params = new URLSearchParams();

    if (searchParams.q) params.append("q", searchParams.q);
    if (searchParams.page) params.append("page", searchParams.page.toString());
    if (searchParams.limit)
      params.append("limit", searchParams.limit.toString());
    if (searchParams.sortBy) params.append("sortBy", searchParams.sortBy);
    if (searchParams.sortType) params.append("sortType", searchParams.sortType);

    const response = await apiClient.get<ApiResponse<any>>(
      `/videos/search?${params.toString()}`
    );

    // Backend returns { data: [...videos], meta: { pagination: {...} } }
    const videos = response.data.data || [];
    const pagination = (response.data as any).meta?.pagination || {
      page: 1,
      limit: 20,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    };

    return {
      docs: Array.isArray(videos) ? videos.map(mapVideoResponse) : [],
      pagination,
    };
  },

  // Get search suggestions
  getSearchSuggestions: async (query: string): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `/videos/suggestions?query=${encodeURIComponent(query)}`
    );
    return response.data.data || [];
  },

  // Get user's videos
  getUserVideos: async (
    userId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Video>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/videos/user/${userId}?page=${page}&limit=${limit}`
    );

    // Backend returns data in response.data (docs array) and meta.pagination
    const docs = (response.data.data || []).map(mapVideoResponse);
    const pagination = (response.data as any).meta?.pagination || {
      page: 1,
      limit: 20,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    };

    return {
      docs,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        totalDocs: pagination.total || 0,
        totalPages: pagination.totalPages || 0,
        hasNextPage: pagination.hasNextPage || false,
        hasPrevPage: pagination.hasPrevPage || false,
      },
    };
  },

  // Upload video
  uploadVideo: async (
    data: UploadVideoFormData | FormData,
    onProgress?: (progress: number) => void
  ): Promise<Video> => {
    let formData: FormData;

    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      formData.append("title", data.title);
      if (data.description) formData.append("description", data.description);
      formData.append("video", data.video[0]);
      if (data.thumbnail && data.thumbnail.length > 0) {
        formData.append("thumbnail", data.thumbnail[0]);
      }
      formData.append("videoformat", data.videoformat);
      formData.append("duration", data.duration.toString());
      if (data.privacy) formData.append("privacy", data.privacy);
      if (data.category) formData.append("category", data.category);
      if (data.tags) formData.append("tags", JSON.stringify(data.tags));
    }

    console.log('Frontend: Starting upload...');
    
    // Calculate timeout based on file size (same logic as backend)
    const videoFile = formData.get('video') as File;
    const fileSizeMB = videoFile?.size ? videoFile.size / 1024 / 1024 : 25; // Default to 25MB if can't get size
    const calculatedTimeout = Math.max(30000, Math.min(600000, fileSizeMB * 1200));
    console.log(`Frontend timeout set to: ${calculatedTimeout / 1000}s for ${fileSizeMB.toFixed(2)}MB file`);
    
    const response = await apiClient.post<ApiResponse<any>>(
      "/videos/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: calculatedTimeout,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log('Upload progress:', progress + '%');
            onProgress(progress);
          }
        },
      }
    );
    console.log('Frontend: Upload completed');
    return mapVideoResponse(response.data.data);
  },

  // Update video (with file upload support for thumbnail)
  updateVideoWithFile: async (
    videoId: string,
    formData: FormData
  ): Promise<Video> => {
    const response = await apiClient.patch<ApiResponse<any>>(
      `/videos/${videoId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return mapVideoResponse(response.data.data);
  },

  // Update video (for JSON data only)
  updateVideo: async (
    videoId: string,
    data: Partial<UploadVideoFormData>
  ): Promise<Video> => {
    const updateData: any = {};

    if (data.title) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.privacy) updateData.privacy = data.privacy;
    if (data.category) updateData.category = data.category;
    if (data.tags) updateData.tags = data.tags;

    const response = await apiClient.patch<ApiResponse<any>>(
      `/videos/${videoId}`,
      updateData
    );
    return mapVideoResponse(response.data.data);
  },

  // Delete video
  deleteVideo: async (videoId: string): Promise<void> => {
    await apiClient.delete(`/videos/${videoId}`);
  },

  // Toggle video like
  toggleLike: async (
    videoId: string
  ): Promise<{ isLiked: boolean; likesCount: number }> => {
    const response = await apiClient.post<
      ApiResponse<{ isLiked: boolean; likesCount: number }>
    >(`/likes/toggle/v/${videoId}`);
    return response.data.data!;
  },

  // Get liked videos
  getLikedVideos: async (): Promise<Video[]> => {
    const response = await apiClient.get<ApiResponse<any>>("/likes/user");
    const videos = response.data.data?.videos || [];
    return videos.map(mapVideoResponse);
  },

  // Increment video views
  incrementViews: async (videoId: string): Promise<void> => {
    await apiClient.post(`/videos/${videoId}/watch`);
  },

  // Report video
  reportVideo: async (
    videoId: string,
    reason: string,
    description?: string
  ): Promise<void> => {
    await apiClient.post(`/reports`, {
      type: "video",
      reportedItem: videoId,
      reason,
      description,
    });
  },
};
