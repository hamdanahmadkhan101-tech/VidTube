/**
 * Force HTTPS for Cloudinary URLs
 */
export const forceHttps = (url: string | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

type UrlLikeUser = {
  avatarUrl?: string;
  avatar?: string;
  coverUrl?: string;
  coverImage?: string;
};

type UrlLikeVideo = {
  videoUrl?: string;
  url?: string;
  thumbnailUrl?: string;
  owner?: UrlLikeUser;
};

/**
 * Format user object with HTTPS URLs
 */
export const formatUserUrls = <T extends UrlLikeUser | null | undefined>(
  user: T,
): T => {
  if (!user) return user;
  return {
    ...user,
    avatarUrl: forceHttps(user.avatarUrl || user.avatar),
    coverUrl: forceHttps(user.coverUrl || user.coverImage),
  } as T;
};

/**
 * Format video object with HTTPS URLs
 */
export const formatVideoUrls = <T extends UrlLikeVideo | null | undefined>(
  video: T,
): T => {
  if (!video) return video;
  return {
    ...video,
    videoUrl: forceHttps(video.videoUrl || video.url),
    thumbnailUrl: forceHttps(video.thumbnailUrl),
    owner: video.owner ? formatUserUrls(video.owner) : video.owner,
  } as T;
};
