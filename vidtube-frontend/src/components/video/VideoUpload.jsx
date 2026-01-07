import { useState, useRef } from "react";
import {
  Upload,
  X,
  Video,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";

export default function VideoUpload({ onUploadSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoformat: "mp4",
    duration: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setErrors((prev) => ({
        ...prev,
        video: "Please select a valid video file",
      }));
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        video: "Video file size must be less than 500MB",
      }));
      return;
    }

    setVideoFile(file);
    setErrors((prev) => ({ ...prev, video: "" }));

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    // Create separate video element for metadata detection
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      // Auto-fill duration
      setFormData((prev) => ({
        ...prev,
        duration: video.duration.toFixed(2),
      }));
    };

    video.src = previewUrl;

    // Auto-detect format
    const format = file.name.split(".").pop().toLowerCase();
    setFormData((prev) => ({ ...prev, videoformat: format }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: "Please select a valid image file",
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        thumbnail: "Thumbnail file size must be less than 10MB",
      }));
      return;
    }

    setThumbnailFile(file);
    setErrors((prev) => ({ ...prev, thumbnail: "" }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!videoFile) {
      newErrors.video = "Video file is required";
    }

    if (!formData.duration || parseFloat(formData.duration) <= 0) {
      newErrors.duration = "Valid duration is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("title", formData.title.trim());
      uploadFormData.append("description", formData.description.trim());
      uploadFormData.append("videoformat", formData.videoformat);
      uploadFormData.append("duration", formData.duration);
      uploadFormData.append("video", videoFile);
      if (thumbnailFile) {
        uploadFormData.append("thumbnail", thumbnailFile);
      }

      if (onUploadSuccess) {
        await onUploadSuccess(uploadFormData, (progress) => {
          setUploadProgress(progress);
        });
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit:
          error.response?.data?.message || "Upload failed. Please try again.",
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      videoformat: "mp4",
      duration: "",
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoPreview(null);
    setThumbnailPreview(null);
    setErrors({});
    setUploadProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{errors.submit}</span>
        </div>
      )}

      {/* Video File Upload */}
      <div>
        <label className="block text-sm font-medium text-textSecondary mb-2">
          Video File <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {videoPreview ? (
            <div className="relative w-full aspect-video bg-surface rounded-lg overflow-hidden">
              <video
                src={videoPreview}
                className="w-full h-full object-contain"
                controls
              />
              <button
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setVideoPreview(null);
                  if (videoInputRef.current) videoInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-full text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => videoInputRef.current?.click()}
              className="relative border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
              />
              <Video className="h-12 w-12 text-textSecondary mx-auto mb-3" />
              <p className="text-sm text-textSecondary mb-1">
                Click to upload video or drag and drop
              </p>
              <p className="text-xs text-textSecondary">
                MP4, AVI, MOV, etc. (Max 500MB)
              </p>
            </div>
          )}
          {errors.video && (
            <p className="text-xs text-red-500">{errors.video}</p>
          )}
        </div>
      </div>

      {/* Thumbnail Upload */}
      <div>
        <label className="block text-sm font-medium text-textSecondary mb-2">
          Thumbnail (Optional)
        </label>
        <div className="space-y-3">
          {thumbnailPreview ? (
            <div className="relative w-full max-w-xs aspect-video bg-surface rounded-lg overflow-hidden">
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setThumbnailFile(null);
                  setThumbnailPreview(null);
                  if (thumbnailInputRef.current)
                    thumbnailInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 rounded-full text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => thumbnailInputRef.current?.click()}
              className="relative border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors max-w-xs"
            >
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
              <ImageIcon className="h-8 w-8 text-textSecondary mx-auto mb-2" />
              <p className="text-xs text-textSecondary">
                Click to upload thumbnail
              </p>
            </div>
          )}
          {errors.thumbnail && (
            <p className="text-xs text-red-500">{errors.thumbnail}</p>
          )}
        </div>
      </div>

      {/* Title */}
      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        placeholder="Enter video title"
        required
        error={errors.title}
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-textSecondary mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Enter video description (optional)"
          rows={4}
          className={`block w-full rounded-md border bg-surface px-3 py-2 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
            errors.description ? "border-red-500" : "border-zinc-700"
          }`}
        />
      </div>

      {/* Duration and Format */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Duration (seconds)"
          name="duration"
          type="number"
          step="0.01"
          min="0.01"
          value={formData.duration}
          onChange={handleInputChange}
          placeholder="Auto-detected from video"
          required
          error={errors.duration}
          disabled={!!videoFile}
        />
        <Input
          label="Video Format"
          name="videoformat"
          value={formData.videoformat}
          onChange={handleInputChange}
          placeholder="mp4"
          required
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-textSecondary">Uploading...</span>
            <span className="text-white font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          isLoading={isUploading}
          disabled={isUploading}
          className="flex-1"
        >
          {isUploading ? "Uploading..." : "Upload Video"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
