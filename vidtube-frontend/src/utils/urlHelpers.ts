/**
 * Force HTTPS for Cloudinary URLs
 */
export const forceHttps = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

/**
 * Format user object with HTTPS URLs
 */
export const formatUserUrls = (user: any) => {
  if (!user) return user;
  return {
    ...user,
    avatarUrl: forceHttps(user.avatarUrl || user.avatar),
    coverUrl: forceHttps(user.coverUrl || user.coverImage),
  };
};

/**
 * Format video object with HTTPS URLs
 */
export const formatVideoUrls = (video: any) => {
  if (!video) return video;
  return {
    ...video,
    videoUrl: forceHttps(video.videoUrl || video.url),
    thumbnailUrl: forceHttps(video.thumbnailUrl),
    owner: video.owner ? formatUserUrls(video.owner) : video.owner,
  };
};