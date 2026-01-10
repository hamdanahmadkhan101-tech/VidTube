import { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
import { useUIStore } from "../../store/index.js";
import { formatDuration } from "../../utils/formatters.js";

export default function VideoPlayer({
  videoUrl,
  poster,
  autoPlay = false,
  title,
}) {
  const videoRef = useRef(null);
  const playerVolume = useUIStore((state) => state.playerVolume);
  const playerMuted = useUIStore((state) => state.playerMuted);
  const setPlayerVolume = useUIStore((state) => state.setPlayerVolume);
  const setPlayerMuted = useUIStore((state) => state.setPlayerMuted);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(playerMuted);
  const [volume, setVolume] = useState(playerVolume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const controlsTimeoutRef = useRef(null);

  // Initialize volume from store
  useEffect(() => {
    if (videoRef.current && playerVolume !== undefined) {
      videoRef.current.volume = playerVolume;
      videoRef.current.muted = playerMuted;
      setVolume(playerVolume);
      setIsMuted(playerMuted);
    }
  }, [playerVolume, playerMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadedData = () => setIsLoading(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleLoadedData);

    // Handle fullscreen change
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleLoadedData);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

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

    // Sync with UI store
    setPlayerMuted(isMuted);
    setPlayerVolume(volume);
  }, [isMuted, volume, setPlayerMuted, setPlayerVolume]);

  // Keyboard shortcuts for video controls (only when video is in viewport/focused)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if user is typing in input/textarea
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      // Check if video is visible/focused
      const rect = video.getBoundingClientRect();
      const isVideoVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (!isVideoVisible) return;

      switch (e.key) {
        case " ": // Spacebar - play/pause
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft": // Seek backward 5 seconds
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case "ArrowRight": // Seek forward 5 seconds
          e.preventDefault();
          video.currentTime = Math.min(duration, video.currentTime + 5);
          break;
        case "ArrowUp": // Volume up
          e.preventDefault();
          const newVolUp = Math.min(1, volume + 0.1);
          setVolume(newVolUp);
          setIsMuted(false);
          break;
        case "ArrowDown": // Volume down
          e.preventDefault();
          const newVolDown = Math.max(0, volume - 0.1);
          setVolume(newVolDown);
          if (newVolDown === 0) setIsMuted(true);
          break;
        case "m":
        case "M": // Toggle mute
          e.preventDefault();
          toggleMute();
          break;
        case "f":
        case "F": // Toggle fullscreen
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [volume, duration, isPlaying]);

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
    return formatDuration(seconds);
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
        src={videoUrl}
        poster={poster}
        className="w-full h-full"
        playsInline
        onClick={togglePlay}
        onLoadStart={() => setIsLoading(true)}
        onLoadedData={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        aria-label={title || "Video player"}
        tabIndex={0}
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 pointer-events-none ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Interactive controls - always clickable */}
      <div
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      ></div>

      {/* Progress bar - always visible for seeking */}
      <div className="absolute bottom-16 left-0 right-0 px-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${
              duration ? (currentTime / duration) * 100 : 0
            }%, rgba(255,255,255,0.2) ${
              duration ? (currentTime / duration) * 100 : 0
            }%, rgba(255,255,255,0.2) 100%)`,
          }}
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={currentTime}
        />
      </div>

      {/* Control buttons - always visible for clicking */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
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
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={isMuted ? 0 : volume}
          />
        </div>

        <div
          className="flex-1 text-white text-sm font-medium"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="sr-only">
            Current time: {formatTime(currentTime)} of {formatTime(duration)}
          </span>
          <span aria-hidden="true">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
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
  );
}
