import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, title = 'Video', className = '' }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        if (newVolume > 0) {
            setIsMuted(false);
        }
    };

    const handleMuteToggle = () => {
        if (videoRef.current) {
            if (isMuted) {
                videoRef.current.volume = volume;
                setIsMuted(false);
            } else {
                videoRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    const handleFullscreen = () => {
        if (containerRef.current) {
            if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen().then(() => {
                    setIsFullscreen(true);
                });
            } else {
                document.exitFullscreen().then(() => {
                    setIsFullscreen(false);
                });
            }
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div
            ref={containerRef}
            className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-cover"
            />

            {/* Overlay Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

            {/* Center Play Button */}
            {!isPlaying && (
                <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center hover:bg-black/20 transition-colors"
                >
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                </button>
            )}

            {/* Controls */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                {/* Title */}
                {title && (
                    <p className="text-white text-sm font-semibold mb-3 truncate">
                        🎬 {title}
                    </p>
                )}

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-white text-xs font-medium min-w-fit">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleProgressChange}
                        className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-red-600"
                    />
                    <span className="text-white text-xs font-medium min-w-fit">{formatTime(duration)}</span>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button
                        onClick={handlePlayPause}
                        className="w-8 h-8 text-white hover:text-red-500 transition-colors flex items-center justify-center"
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5" />
                        ) : (
                            <Play className="w-5 h-5 ml-0.5" />
                        )}
                    </button>

                    {/* Volume */}
                    <button
                        onClick={handleMuteToggle}
                        className="w-8 h-8 text-white hover:text-red-500 transition-colors flex items-center justify-center"
                    >
                        {isMuted ? (
                            <VolumeX className="w-5 h-5" />
                        ) : (
                            <Volume2 className="w-5 h-5" />
                        )}
                    </button>

                    {/* Volume Slider */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-red-600"
                    />

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Fullscreen */}
                    <button
                        onClick={handleFullscreen}
                        className="w-8 h-8 text-white hover:text-red-500 transition-colors flex items-center justify-center"
                    >
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
