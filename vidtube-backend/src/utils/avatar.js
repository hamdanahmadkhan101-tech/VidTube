const DICEBEAR_BASE_URL = 'https://api.dicebear.com/9.x/initials/svg';
const DEFAULT_SEED = 'VidTube User';

export const DEFAULT_AVATAR_URL =
  process.env.DEFAULT_AVATAR_URL ||
  `${DICEBEAR_BASE_URL}?seed=${encodeURIComponent(DEFAULT_SEED)}&backgroundColor=1f2937&textColor=ffffff`;

export const buildDefaultAvatarUrl = ({ fullName, username, email } = {}) => {
  const rawSeed = [fullName, username, email].find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  if (!rawSeed) {
    return DEFAULT_AVATAR_URL;
  }

  const seed = encodeURIComponent(rawSeed.trim());
  return `${DICEBEAR_BASE_URL}?seed=${seed}&backgroundColor=1f2937&textColor=ffffff`;
};

export const isCloudinaryUrl = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com');
