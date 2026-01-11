import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Upload, Film, Image, Loader2, X } from "lucide-react";
import { videoService } from "../services/videoService.ts";
import { handleApiError } from "../services/apiClient.ts";
import toast from "react-hot-toast";

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [privacy, setPrivacy] = useState<"public" | "unlisted" | "private">(
    "public"
  );
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploadController, setUploadController] = useState<AbortController | null>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [videoPreview, thumbnailPreview]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile) throw new Error("Video file is required");
      if (!videoDuration)
        throw new Error("Video duration could not be determined");

      const controller = new AbortController();
      setUploadController(controller);

      const formData = new FormData();
      formData.append("title", title);
      if (description) formData.append("description", description);
      formData.append("video", videoFile);
      if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
      formData.append("privacy", privacy);
      if (category) formData.append("category", category);
      if (tags) {
        formData.append(
          "tags",
          JSON.stringify(
            tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          )
        );
      }
      formData.append("videoformat", videoFile.type.split("/")[1] || "mp4");
      formData.append("duration", videoDuration.toString());

      return videoService.uploadVideoWithCancel(formData, (progress) => {
        setUploadProgress(progress);
      }, controller.signal);
    },
    retry: 2, // Retry failed uploads twice
    retryDelay: 3000, // Wait 3 seconds between retries
    onSuccess: (data) => {
      toast.success("Video uploaded successfully!");
      setUploadProgress(0);
      setUploadController(null);
      navigate(`/watch/${data._id}`);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      setUploadController(null);
      if (error.name !== 'AbortError') {
        toast.error(handleApiError(error));
      }
    },
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 1024) {
        toast.error("Video file must be less than 1GB");
        return;
      }
      
      // Clean up previous preview
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);

      // Get video duration
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        setVideoDuration(Math.round(video.duration));
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        toast.error("Could not read video metadata");
        URL.revokeObjectURL(video.src);
      };
      video.src = url;
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Thumbnail must be less than 5MB");
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleCancel = () => {
    if (uploadController) {
      uploadController.abort();
      setUploadController(null);
      setUploadProgress(0);
      toast.success("Upload cancelled");
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!videoFile) {
      toast.error("Video file is required");
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 sm:p-6 lg:p-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Upload Video
        </h1>
        <p className="text-text-secondary mb-4 sm:mb-8 text-sm sm:text-base">
          Share your content with the world
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Video File *
            </label>
            {!videoFile ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary-500 transition-colors glass-card">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Film className="w-12 h-12 text-text-muted mb-4" />
                  <p className="mb-2 text-sm text-text-secondary">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-text-muted">
                    MP4, WebM, or AVI (MAX. 1GB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleVideoSelect}
                />
              </label>
            ) : (
              <div className="relative glass-card p-4 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    if (videoPreview) {
                      URL.revokeObjectURL(videoPreview);
                    }
                    setVideoFile(null);
                    setVideoPreview(null);
                    setVideoDuration(0);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors z-10"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {videoPreview && (
                  <video
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg mb-2"
                    style={{ maxHeight: "300px" }}
                  />
                )}
                <p className="text-sm text-text-secondary">{videoFile.name}</p>
                <p className="text-xs text-text-muted">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Thumbnail (Optional)
            </label>
            {!thumbnailFile ? (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary-500 transition-colors glass-card">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Image className="w-8 h-8 text-text-muted mb-2" />
                  <p className="text-sm text-text-secondary">
                    Upload thumbnail
                  </p>
                  <p className="text-xs text-text-muted">PNG, JPG (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                />
              </label>
            ) : (
              <div className="relative glass-card p-4 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailFile(null);
                    setThumbnailPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors z-10"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input w-full"
              placeholder="Enter video title"
              maxLength={100}
            />
            <p className="text-xs text-text-muted mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full h-32 resize-none"
              placeholder="Tell viewers about your video"
              maxLength={5000}
            />
            <p className="text-xs text-text-muted mt-1">
              {description.length}/5000
            </p>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Privacy
            </label>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as any)}
              className="glass-input w-full"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input w-full"
              placeholder="e.g., Gaming, Music, Education"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="glass-input w-full"
              placeholder="Separate tags with commas (e.g., gaming, tutorial, fun)"
            />
          </div>

          {/* Upload Progress */}
          {uploadMutation.isPending && (
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-primary">Uploading...</span>
                <span className="text-sm text-text-secondary">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-blue"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={uploadMutation.isPending || !videoFile || !title.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Video
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={false}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UploadPage;
