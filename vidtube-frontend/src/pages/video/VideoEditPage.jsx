import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Edit3, Save, X } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { getVideoById, updateVideo, togglePublishStatus } from '../../services/videoService.js';
import useAuth from '../../hooks/useAuth.js';

export default function VideoEditPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await getVideoById(videoId);
        const videoData = response.data.data;
        
        if (videoData.owner._id !== user._id) {
          toast.error('You can only edit your own videos');
          navigate('/');
          return;
        }
        
        setVideo(videoData);
        setFormData({
          title: videoData.title,
          description: videoData.description || ''
        });
      } catch (error) {
        toast.error('Failed to load video');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, user._id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setThumbnailPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const updateFormData = new FormData();
      updateFormData.append('title', formData.title.trim());
      updateFormData.append('description', formData.description.trim());
      if (thumbnailFile) {
        updateFormData.append('thumbnail', thumbnailFile);
      }

      await updateVideo(videoId, updateFormData);
      toast.success('Video updated successfully');
      navigate(`/video/${videoId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update video');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      await togglePublishStatus(videoId);
      setVideo(prev => ({ ...prev, isPublished: !prev.isPublished }));
      toast.success(`Video ${video.isPublished ? 'unpublished' : 'published'} successfully`);
    } catch (error) {
      toast.error('Failed to update publish status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-textSecondary">Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Edit3 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white">Edit Video</h1>
          </div>
          <p className="text-textSecondary">
            Update your video details and settings.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                Current Thumbnail
              </label>
              <div className="flex gap-4">
                <div className="w-32 aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                  <img
                    src={thumbnailPreview || video.thumbnailUrl || '/placeholder-video.jpg'}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="block w-full text-sm text-textSecondary file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-zinc-700"
                  />
                  <p className="text-xs text-textSecondary mt-1">
                    Upload new thumbnail (optional)
                  </p>
                </div>
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
                placeholder="Enter video description"
                rows={4}
                className="block w-full rounded-md border border-zinc-700 bg-surface px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Publish Status */}
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div>
                <h3 className="font-medium text-white">Publication Status</h3>
                <p className="text-sm text-textSecondary">
                  {video.isPublished ? 'Video is public and visible to everyone' : 'Video is private and only visible to you'}
                </p>
              </div>
              <Button
                type="button"
                variant={video.isPublished ? 'outline' : 'secondary'}
                onClick={handleTogglePublish}
              >
                {video.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                isLoading={saving}
                disabled={saving}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/video/${videoId}`)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}