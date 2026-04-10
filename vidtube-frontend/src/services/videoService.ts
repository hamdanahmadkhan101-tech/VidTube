import apiClient from "./apiClient";
import { forceHttps } from "../utils/urlHelpers";
import type {
  ApiResponse,
  PaginatedResponse,
  Video,
  VideoFilters,
  SearchParams,
  UploadVideoFormData,
} from "../types";

type VideoOwnerPayload = Partial<Video["owner"]> & {
  avatar?: string;
  avatarUrl?: string;
  subscribersCount?: number;
};

type VideoPayload = Partial<Video> & {
  url?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  likesCount?: number;
  likes?: number;
  views?: number;
  owner?: VideoOwnerPayload;
};

type LikedVideoEntry = {
  video?: VideoPayload;
};

type WatchHistoryPayload = {
  videos?: VideoPayload[];
  pagination?: {
    currentPage?: number;
    totalPages?: number;
    totalVideos?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};

type PaginationMeta = NonNullable<
  NonNullable<ApiResponse<unknown>["meta"]>["pagination"]
>;

const toPagination = (
  pagination?: PaginationMeta,
): PaginatedResponse<Video>["pagination"] => ({
  page: pagination?.page ?? 1,
  limit: pagination?.limit ?? 20,
  totalDocs: pagination?.totalDocs ?? pagination?.total ?? 0,
  totalPages: pagination?.totalPages ?? 0,
  hasNextPage: pagination?.hasNextPage ?? false,
  hasPrevPage: pagination?.hasPrevPage ?? false,
});

// Helper to map backend response to frontend Video type
const mapVideoResponse = (video: VideoPayload): Video => ({
  ...(video as Video),
  videoUrl: forceHttps(video.url || video.videoUrl),
  thumbnailUrl: forceHttps(video.thumbnailUrl),
  likes: video.likesCount ?? video.likes ?? 0,
  views: video.views ?? 0,
  owner: video.owner
    ? {
        ...(video.owner as Video["owner"]),
        avatarUrl: forceHttps(video.owner.avatarUrl || video.owner.avatar),
        subscribersCount: video.owner.subscribersCount ?? 0,
      }
    : ({} as Video["owner"]),
});

export const videoService = {
  // Conservative timeout budget for large uploads on slower uplinks.
  // Formula: size-based timeout with sensible floor/ceiling.
  getUploadTimeoutMs: (fileSizeBytes: number): number => {
    const fileSizeMB = fileSizeBytes > 0 ? fileSizeBytes / 1024 / 1024 : 25;
    const perMbMs = 10000; // 10s per MB
    const minMs = 2 * 60 * 1000; // 2 minutes
    const maxMs = 15 * 60 * 1000; // 15 minutes

    return Math.max(minMs, Math.min(maxMs, Math.ceil(fileSizeMB * perMbMs)));
  },

  // Get all videos with pagination and filters
  getVideos: async (
    filters?: VideoFilters,
  ): Promise<PaginatedResponse<Video>> => {
    const params = new URLSearchParams();

    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortType) params.append("sortType", filters.sortType);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.tags) params.append("tags", filters.tags.join(","));

    const response = await apiClient.get<ApiResponse<VideoPayload[]>>(
      `/videos?${params.toString()}`,
    );

    // Backend returns { data: [...videos], meta: { pagination: {...} } }
    const videos = (response.data.data || []).map(mapVideoResponse);
    return {
      docs: videos,
      pagination: toPagination(response.data.meta?.pagination),
    };
  },

  // Get video by ID
  getVideoById: async (videoId: string): Promise<Video> => {
    const response = await apiClient.get<ApiResponse<VideoPayload>>(
      `/videos/${videoId}`,
    );
    if (!response.data.data) {
      throw new Error("Video not found");
    }
    return mapVideoResponse(response.data.data);
  },

  // Search videos
  searchVideos: async (
    searchParams: SearchParams,
  ): Promise<PaginatedResponse<Video>> => {
    const params = new URLSearchParams();

    if (searchParams.q) params.append("q", searchParams.q);
    if (searchParams.page) params.append("page", searchParams.page.toString());
    if (searchParams.limit)
      params.append("limit", searchParams.limit.toString());
    if (searchParams.sortBy) params.append("sortBy", searchParams.sortBy);
    if (searchParams.sortType) params.append("sortType", searchParams.sortType);

    const response = await apiClient.get<ApiResponse<VideoPayload[]>>(
      `/videos/search?${params.toString()}`,
    );

    // Backend returns { data: [...videos], meta: { pagination: {...} } }
    const videos = response.data.data || [];

    return {
      docs: Array.isArray(videos) ? videos.map(mapVideoResponse) : [],
      pagination: toPagination(response.data.meta?.pagination),
    };
  },

  // Get search suggestions
  getSearchSuggestions: async (query: string): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `/videos/suggestions?query=${encodeURIComponent(query)}`,
    );
    return response.data.data || [];
  },

  // Get user's videos
  getUserVideos: async (
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Video>> => {
    const response = await apiClient.get<ApiResponse<VideoPayload[]>>(
      `/videos/user/${userId}?page=${page}&limit=${limit}`,
    );

    // Backend returns data in response.data (docs array) and meta.pagination
    const docs = (response.data.data || []).map(mapVideoResponse);

    return {
      docs,
      pagination: toPagination(response.data.meta?.pagination),
    };
  },

  // Upload video
  uploadVideo: async (
    data: UploadVideoFormData | FormData,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
    idempotencyKey?: string,
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

    // Calculate timeout budget based on file size for slow/variable uplinks.
    const videoFile = formData.get("video") as File;
    const calculatedTimeout = videoService.getUploadTimeoutMs(
      videoFile?.size || 0,
    );

    const response = await apiClient.post<ApiResponse<VideoPayload>>(
      "/videos/upload",
      formData,
      {
        headers: idempotencyKey
          ? {
              "Idempotency-Key": idempotencyKey,
            }
          : undefined,
        timeout: calculatedTimeout,
        signal,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(progress);
          }
        },
      },
    );
    if (!response.data.data) {
      throw new Error("Failed to upload video");
    }
    return mapVideoResponse(response.data.data);
  },

  // Update video (with file upload support for thumbnail)
  updateVideoWithFile: async (
    videoId: string,
    formData: FormData,
  ): Promise<Video> => {
    const response = await apiClient.patch<ApiResponse<VideoPayload>>(
      `/videos/${videoId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (!response.data.data) {
      throw new Error("Failed to update video");
    }
    return mapVideoResponse(response.data.data);
  },

  // Update video (for JSON data only)
  updateVideo: async (
    videoId: string,
    data: Partial<UploadVideoFormData>,
  ): Promise<Video> => {
    const updateData: Partial<
      Pick<
        UploadVideoFormData,
        "title" | "description" | "privacy" | "category" | "tags"
      >
    > = {};

    if (data.title) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.privacy) updateData.privacy = data.privacy;
    if (data.category) updateData.category = data.category;
    if (data.tags) updateData.tags = data.tags;

    const response = await apiClient.patch<ApiResponse<VideoPayload>>(
      `/videos/${videoId}`,
      updateData,
    );
    if (!response.data.data) {
      throw new Error("Failed to update video");
    }
    return mapVideoResponse(response.data.data);
  },

  // Delete video
  deleteVideo: async (videoId: string): Promise<void> => {
    await apiClient.delete(`/videos/${videoId}`);
  },

  // Toggle video like
  toggleLike: async (
    videoId: string,
  ): Promise<{ isLiked: boolean; likesCount: number }> => {
    const response = await apiClient.post<
      ApiResponse<{ isLiked: boolean; likesCount: number }>
    >(`/likes/toggle/v/${videoId}`);
    return response.data.data!;
  },

  // Get liked videos
  getLikedVideos: async (): Promise<Video[]> => {
    const response =
      await apiClient.get<ApiResponse<{ docs?: LikedVideoEntry[] }>>(
        "/likes/videos",
      );
    const paginated = response.data.data || {};
    const docs = paginated.docs || [];

    return docs
      .map((item) => item?.video)
      .filter((video): video is VideoPayload => Boolean(video))
      .map(mapVideoResponse);
  },

  // Get watch history
  getWatchHistory: async (
    page = 1,
    limit = 24,
  ): Promise<{
    videos: Video[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalVideos: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> => {
    const response = await apiClient.get<ApiResponse<WatchHistoryPayload>>(
      `/users/watch-history?page=${page}&limit=${limit}`,
    );
    const payload = response.data.data;

    return {
      videos: (payload?.videos || []).map(mapVideoResponse),
      pagination: {
        currentPage: payload?.pagination?.currentPage ?? page,
        totalPages: payload?.pagination?.totalPages ?? 0,
        totalVideos: payload?.pagination?.totalVideos ?? 0,
        hasNextPage: payload?.pagination?.hasNextPage ?? false,
        hasPrevPage: payload?.pagination?.hasPrevPage ?? false,
      },
    };
  },

  // Increment video views
  incrementViews: async (videoId: string): Promise<void> => {
    await apiClient.post(`/videos/${videoId}/watch`);
  },

  // Report video
  reportVideo: async (
    videoId: string,
    reason: string,
    description?: string,
  ): Promise<void> => {
    await apiClient.post(`/reports`, {
      type: "video",
      reportedItem: videoId,
      reason,
      description,
    });
  },
};
