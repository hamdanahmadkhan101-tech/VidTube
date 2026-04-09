import fs from 'fs';
import path from 'path';

const TEMP_DIR = path.join(process.cwd(), 'public', 'temp');
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Delete a single file safely
 * @param {string} filePath - Path to the file to delete
 * @returns {boolean} - True if deleted successfully
 */
export const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Clean up old temp files (older than MAX_AGE_MS)
 * This runs as a scheduled job to prevent temp directory from filling up
 */
export const cleanupOldTempFiles = () => {
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      console.log('Temp directory does not exist');
      return;
    }

    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    let deletedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(TEMP_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > MAX_AGE_MS) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`Deleted old temp file: ${file}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error.message);
      }
    });

    if (deletedCount > 0) {
      console.log(
        `Cleanup completed: ${deletedCount} old temp file(s) deleted`
      );
    }
  } catch (error) {
    console.error('Error during temp file cleanup:', error.message);
  }
};

/**
 * Delete all files in temp directory
 * WARNING: Use with caution - deletes ALL temp files
 */
export const clearAllTempFiles = () => {
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      console.log('Temp directory does not exist');
      return 0;
    }

    const files = fs.readdirSync(TEMP_DIR);
    let deletedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(TEMP_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error.message);
      }
    });

    console.log(`Cleared ${deletedCount} file(s) from temp directory`);
    return deletedCount;
  } catch (error) {
    console.error('Error clearing temp files:', error.message);
    return 0;
  }
};

/**
 * Start the cleanup scheduler
 * Runs cleanup every hour
 */
export const startCleanupScheduler = () => {
  // Run immediately on startup
  cleanupOldTempFiles();

  // Then run every hour
  const interval = setInterval(cleanupOldTempFiles, MAX_AGE_MS);

  // Return cleanup function
  return () => {
    clearInterval(interval);
  };
};
