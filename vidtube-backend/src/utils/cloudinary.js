import { v2 as cloudinary } from 'cloudinary';
import { deleteFile } from './cleanupTemp.js';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS URLs
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) {
      console.error('No file path provided to uploadOnCloudinary');
      return null;
    }

    if (!fs.existsSync(filePath)) {
      console.error(`File not found for upload: ${filePath}`);
      return null;
    }

    console.log(`Starting Cloudinary upload for: ${filePath}`);
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = fileStats.size / 1024 / 1024;
    console.log(`File size: ${fileSizeMB.toFixed(2)}MB`);
    
    // Calculate timeout based on file size (1.2 seconds per MB, minimum 30s, maximum 10 minutes)
    const calculatedTimeout = Math.max(30000, Math.min(600000, fileSizeMB * 1200));
    console.log(`Upload timeout set to: ${calculatedTimeout / 1000}s`);
    
    const uploadOptions = {
      resource_type: 'auto',
      secure: true,
      timeout: calculatedTimeout,
      chunk_size: 6000000, // 6MB chunks
    };
    
    // Use chunked upload for files larger than 50MB
    if (fileSizeMB > 50) {
      console.log('Using chunked upload for large file');
    }
    
    const response = await cloudinary.uploader.upload(filePath, uploadOptions);

    // Always use secure_url and ensure HTTPS
    const secureUrl = response.secure_url || response.url;
    if (secureUrl && secureUrl.startsWith('http:')) {
      response.url = secureUrl.replace('http:', 'https:');
    } else {
      response.url = secureUrl;
    }

    console.log('Cloudinary upload successful:', response.public_id, 'URL:', response.url);
    // Always delete temp file after successful upload
    deleteFile(filePath);
    return response;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Always try to clean up temp file even on error
    deleteFile(filePath);
    
    // Handle specific timeout errors
    if (error.message && error.message.includes('timeout')) {
      const timeoutError = new Error(`Upload timeout: File too large or connection too slow. Try a smaller file or check your internet connection.`);
      timeoutError.code = 'UPLOAD_TIMEOUT';
      throw timeoutError;
    }
    
    // Handle other Cloudinary errors
    if (error.http_code) {
      const cloudinaryError = new Error(`Cloudinary error: ${error.message}`);
      cloudinaryError.code = 'CLOUDINARY_ERROR';
      throw cloudinaryError;
    }
    
    throw error; // Re-throw to let controller handle it
  }
};

const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl) return null;
    // Extract public_id from Cloudinary URL
    const publicId = imageUrl.split('/').pop().split('.')[0];

    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    // Silently fail - deletion errors shouldn't break the app
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
