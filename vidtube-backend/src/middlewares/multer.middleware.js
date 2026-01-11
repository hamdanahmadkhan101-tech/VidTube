import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    // Allow video formats
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for video field'), false);
    }
  } else if (file.fieldname === 'thumbnail' || file.fieldname === 'avatar' || file.fieldname === 'coverImage') {
    // Allow image formats
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for image fields'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Specific upload configurations for different use cases
export const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB for professional video uploads
    files: 2, // video + thumbnail
  },
  fileFilter: fileFilter
});

export const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for image files
    files: 2, // avatar + cover or single image
  },
  fileFilter: fileFilter
});

// Default upload (legacy - for backward compatibility)
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default
    files: 2,
  },
  fileFilter: fileFilter
});

export default upload;