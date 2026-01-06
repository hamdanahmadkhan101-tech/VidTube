import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Upload as UploadIcon } from "lucide-react";
import Header from "../../components/layout/Header.jsx";
import VideoUpload from "../../components/video/VideoUpload.jsx";
import { uploadVideo } from "../../services/videoService.js";
import ProtectedRoute from "../../components/common/ProtectedRoute.jsx";

function UploadPageContent() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadSuccess = async (formData, onProgress) => {
    setIsUploading(true);
    try {
      const response = await uploadVideo(formData, onProgress);
      toast.success("Video uploaded successfully!");
      navigate(`/video/${response.data.data._id}`);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to upload video. Please try again.";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UploadIcon className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white">Upload Video</h1>
          </div>
          <p className="text-textSecondary">
            Share your content with the world. Fill in the details below to
            upload your video.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
          <VideoUpload
            onUploadSuccess={handleUploadSuccess}
            onCancel={() => navigate("/")}
          />
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadPageContent />
    </ProtectedRoute>
  );
}
