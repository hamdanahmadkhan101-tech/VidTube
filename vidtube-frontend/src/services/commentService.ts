import apiClient from "./apiClient";
import type { ApiResponse, PaginatedResponse, Comment } from "../types";

type AggregatePaginated<T> = {
  docs?: T[];
  page?: number;
  limit?: number;
  totalDocs?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};

type CreateCommentResponse = Comment | { comment: Comment };

export const commentService = {
  // Get comments for a video
  getVideoComments: async (
    videoId: string,
    page = 1,
    limit = 20,
    sortBy: "top" | "newest" = "top",
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await apiClient.get<
      ApiResponse<AggregatePaginated<Comment>>
    >(`/comments/${videoId}?page=${page}&limit=${limit}&sortBy=${sortBy}`);
    // Backend returns aggregatePaginate result: { docs: [...], page, totalDocs, ... }
    const paginatedData = response.data.data || {};
    return {
      docs: paginatedData.docs || [],
      pagination: {
        page: paginatedData.page || 1,
        limit: paginatedData.limit || 20,
        totalDocs: paginatedData.totalDocs || 0,
        totalPages: paginatedData.totalPages || 0,
        hasNextPage: paginatedData.hasNextPage || false,
        hasPrevPage: paginatedData.hasPrevPage || false,
      },
    };
  },

  // Create comment
  createComment: async (
    videoId: string,
    content: string,
    parentId?: string,
  ): Promise<Comment> => {
    const response = await apiClient.post<ApiResponse<CreateCommentResponse>>(
      `/comments/${videoId}`,
      { content, parent: parentId },
    );
    // Backend might return { comment: {...} } or just the comment
    const result = response.data.data;
    if (!result) {
      throw new Error("Failed to create comment");
    }
    return "comment" in result ? result.comment : result;
  },

  // Update comment
  updateComment: async (
    commentId: string,
    content: string,
  ): Promise<Comment> => {
    const response = await apiClient.patch<ApiResponse<Comment>>(
      `/comments/c/${commentId}`,
      { content },
    );
    return response.data.data!;
  },

  // Delete comment
  deleteComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/c/${commentId}`);
  },

  // Toggle comment like
  toggleLike: async (
    commentId: string,
  ): Promise<{ isLiked: boolean; likesCount: number }> => {
    const response = await apiClient.post<
      ApiResponse<{ isLiked: boolean; likesCount: number }>
    >(`/likes/toggle/c/${commentId}`);
    return response.data.data!;
  },

  // Get comment replies
  getReplies: async (
    parentId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Comment>>
    >(`/comments/${parentId}/replies?page=${page}&limit=${limit}`);
    return response.data.data!;
  },
};
