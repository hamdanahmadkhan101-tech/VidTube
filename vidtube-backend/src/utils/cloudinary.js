import { v2 as cloudinary } from 'cloudinary';
import { deleteFile } from './cleanupTemp.js';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) {
      return null;
    }

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileStats = fs.statSync(filePath);
    const fileSizeMB = fileStats.size / 1024 / 1024;

    // Keep server-to-cloud uploads resilient for slower network paths.
    const perMbMs = 5000; // 5s per MB
    const calculatedTimeout = Math.max(
      120000,
      Math.min(900000, Math.ceil(fileSizeMB * perMbMs))
    );

    const uploadOptions = {
      resource_type: 'auto',
      secure: true,
      timeout: calculatedTimeout,
      chunk_size: 6000000,
    };

    // Check if it's a video file
    const isVideo = filePath.match(
      /\.(mp4|mov|avi|mkv|flv|wmv|webm|m4v|3gp|ogv|ts|m3u8)$/i
    );

    if (isVideo) {
      // Add video transformation for MP4 conversion
      uploadOptions.eager = [
        {
          format: 'mp4',
          video_codec: 'h264',
          audio_codec: 'aac',
          bit_rate: '2m',
        },
      ];
      uploadOptions.eager_async = true;
    }

    const response = await cloudinary.uploader.upload(filePath, uploadOptions);

    const secureUrl = response.secure_url || response.url;
    if (secureUrl && secureUrl.startsWith('http:')) {
      response.url = secureUrl.replace('http:', 'https:');
    } else {
      response.url = secureUrl;
    }

    deleteFile(filePath);
    return response;
  } catch (error) {
    deleteFile(filePath);

    if (error.message && error.message.includes('timeout')) {
      const timeoutError = new Error(
        `Upload timeout: File too large or connection too slow. Try a smaller file or check your internet connection.`
      );
      timeoutError.code = 'UPLOAD_TIMEOUT';
      throw timeoutError;
    }

    if (error.http_code) {
      const cloudinaryError = new Error(`Cloudinary error: ${error.message}`);
      cloudinaryError.code = 'CLOUDINARY_ERROR';
      throw cloudinaryError;
    }

    throw error;
  }
};

const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl) return null;
    const publicId = imageUrl.split('/').pop().split('.')[0];

    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
