import apiClient from "./apiClient";
import type { ApiResponse, PaginatedResponse, Comment } from "../types";

export const commentService = {
  // Get comments for a video
  getVideoComments: async (
    videoId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/comments/${videoId}?page=${page}&limit=${limit}`
    );
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
    parentId?: string
  ): Promise<Comment> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/comments/${videoId}`,
      { content, parent: parentId }
    );
    // Backend might return { comment: {...} } or just the comment
    return response.data.data?.comment || response.data.data;
  },

  // Update comment
  updateComment: async (
    commentId: string,
    content: string
  ): Promise<Comment> => {
    const response = await apiClient.patch<ApiResponse<{ comment: Comment }>>(
      `/comments/c/${commentId}`,
      { content }
    );
    return response.data.data!.comment;
  },

  // Delete comment
  deleteComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/c/${commentId}`);
  },

  // Toggle comment like
  toggleLike: async (
    commentId: string
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
    limit = 10
  ): Promise<PaginatedResponse<Comment>> => {
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Comment>>
    >(`/comments/${parentId}/replies?page=${page}&limit=${limit}`);
    return response.data.data!;
  },
};
