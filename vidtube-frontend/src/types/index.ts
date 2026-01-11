// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: Array<{ field?: string; message: string }>;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  docs: T[];
  pagination: {
    page: number;
    limit: number;
    totalDocs: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// User Types
export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string; // For backward compatibility
  avatarUrl?: string; // Primary field from backend
  coverImage?: string; // For backward compatibility
  coverUrl?: string; // Primary field from backend
  bio?: string;
  subscribersCount?: number;
  subscribedToCount?: number;
  isSubscribed?: boolean;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  accessToken?: string;
}

// Video Types
export interface Video {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  views: number;
  likes: number;
  isLiked?: boolean;
  privacy: "public" | "unlisted" | "private";
  category?: string;
  tags?: string[];
  owner: User;
  createdAt: string;
  updatedAt: string;
}

// Comment Types
export interface Comment {
  _id: string;
  content: string;
  owner: User;
  video: string;
  parent?: string;
  likes: number;
  isLiked?: boolean;
  repliesCount?: number;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Subscription Types
export interface Subscription {
  _id: string;
  subscriber: string;
  channel: User;
  createdAt: string;
}

// Like Types
export interface Like {
  _id: string;
  video?: string;
  comment?: string;
  owner: string;
  createdAt: string;
}

// Playlist Types
export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  owner: User;
  videos: Video[];
  privacy: "public" | "unlisted" | "private";
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: "like" | "comment" | "subscription" | "upload";
  video?: Video;
  comment?: Comment;
  isRead: boolean;
  createdAt: string;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  avatar?: FileList;
  coverImage?: FileList;
}

export interface UploadVideoFormData {
  title: string;
  description?: string;
  video: FileList;
  thumbnail?: FileList;
  videoformat: string;
  duration: number;
  privacy?: "public" | "unlisted" | "private";
  category?: string;
  tags?: string[];
}

export interface UpdateProfileFormData {
  fullName?: string;
  bio?: string;
  avatar?: FileList;
  coverImage?: FileList;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

// Search & Filter Types
export interface VideoFilters {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "views" | "title";
  sortType?: "asc" | "desc";
  category?: string;
  tags?: string[];
}

export interface SearchParams extends VideoFilters {
  q?: string;
}
