import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";

export default function VideoPlayer({
  videoUrl,
  poster,
  autoPlay = false,
  videoId,
  onProgress,
  initialTime = 0,
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Force HTTPS for video URLs (fix mixed content)
  const secureVideoUrl = videoUrl?.replace(/^http:\/\//i, "https://");
  const securePoster = poster?.replace(/^http:\/\//i, "https://");

  // Save progress periodically
  const saveProgress = useCallback(() => {
    if (onProgress && videoId && videoRef.current) {
      const video = videoRef.current;
      if (video.currentTime > 0 && video.duration > 0) {
        onProgress(videoId, video.currentTime, video.duration);
      }
    }
  }, [onProgress, videoId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => {
      setDuration(video.duration);
      // Set initial time if provided
      if (initialTime > 0 && video.duration > 0) {
        video.currentTime = initialTime;
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      // Start progress tracking interval
      if (onProgress && videoId) {
        progressIntervalRef.current = setInterval(saveProgress, 10000); // Save every 10 seconds
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      saveProgress(); // Save on pause
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      saveProgress(); // Save on end
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [initialTime, saveProgress, onProgress, videoId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch((err) => {
        // Auto-play blocked by browser - user needs to interact
        if (err.name === "NotAllowedError") {
          // This is expected behavior, no action needed
        }
      });
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.volume = volume;
  }, [isMuted, volume]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  return (
    <div
      className="relative w-full bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={secureVideoUrl}
        poster={securePoster}
        className="w-full h-full"
        playsInline
        onClick={togglePlay}
      />

      {/* Controls overlay - always show when paused or when showControls */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 pointer-events-none ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Big play button - centered, clickable */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 bottom-20 flex items-center justify-center cursor-pointer pointer-events-auto"
            aria-label="Play video"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-colors shadow-lg">
              <Play className="h-8 w-8 md:h-10 md:w-10 text-white ml-1" />
            </div>
          </button>
        )}
        {/* Progress bar */}
        <div className="absolute bottom-14 left-0 right-0 px-4 pointer-events-auto z-10">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                (currentTime / (duration || 1)) * 100
              }%, rgba(255,255,255,0.3) ${
                (currentTime / (duration || 1)) * 100
              }%, rgba(255,255,255,0.3) 100%)`,
            }}
          />
        </div>

        {/* Control buttons */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center gap-4 pointer-events-auto z-10 bg-gradient-to-t from-black/90 to-transparent">
          <button
            onClick={togglePlay}
            className="text-white hover:text-primary transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-white hover:text-primary transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="flex-1 text-white text-sm font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-primary transition-colors"
            aria-label="Fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
