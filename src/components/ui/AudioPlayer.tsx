import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X } from 'lucide-react';

interface AudioPlayerProps {
    src: string;
    title?: string;
    preacher?: string;
    series?: string;
    date?: string;
    poster?: string;
    onClose?: () => void;
    className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    src,
    title = 'Audio',
    preacher,
    series,
    date,
    poster,
    onClose,
    className = ''
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [waveform, setWaveform] = useState<number[]>([]);

    // Generate waveform visualization
    useEffect(() => {
        const generateWaveform = () => {
            const bars = 60;
            const newWaveform = Array.from({ length: bars }, () => Math.random() * 0.7 + 0.3);
            setWaveform(newWaveform);
        };
        generateWaveform();
    }, []);

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
        if (newVolume > 0) {
            setIsMuted(false);
        }
    };

    const handleMuteToggle = () => {
        if (audioRef.current) {
            if (isMuted) {
                audioRef.current.volume = volume;
                setIsMuted(false);
            } else {
                audioRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';

        try {
            // Handle DD/MM/YYYY format
            if (dateString.includes('/')) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                    const year = parseInt(parts[2]);
                    const date = new Date(year, month, day);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                }
            }

            // Handle ISO format or other date formats
            if (dateString.includes('-')) {
                const date = new Date(dateString);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            }

            return dateString;
        } catch {
            return dateString;
        }
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Header with Badge and Close Button */}
            <div className="flex items-center justify-between mb-3">
                <div className="text-xs bg-cyan-100 w-fit p-1.5 rounded font-bold tracking-widest text-blue-500">
                    <p>NOW PLAYING</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label="Close player"
                    >
                        <X size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                )}
            </div>

            {/* Title and Metadata */}
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                    {title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    {preacher && (
                        <>
                            <span className="font-medium text-gray-900 dark:text-white">{preacher}</span>
                            <span>•</span>
                        </>
                    )}
                    {series && (
                        <>
                            <span>{series}</span>
                            <span>•</span>
                        </>
                    )}
                    {date && <span className="font-medium text-gray-600 dark:text-white">{formatDate(date)}</span>}
                </div>
            </div>

            {/* Waveform */}
            <div className="flex items-center justify-center gap-1 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 mb-6 backdrop-blur-sm">
                {waveform.map((height, index) => (
                    <div
                        key={index}
                        className="flex-1 rounded-full transition-all duration-100 bg-gradient-to-t from-blue-400 to-blue-300 dark:from-blue-500 dark:to-blue-400 opacity-80 hover:opacity-100"
                        style={{
                            height: `${Math.max(15, height * 60)}%`
                        }}
                    />
                ))}
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between gap-6 mb-6">
                {/* Left: Playback Controls */}
                <div className="flex items-center gap-4">
                    {/* Play Button */}
                    <button
                        onClick={handlePlayPause}
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        {isPlaying ? (
                            <Pause className="w-7 h-7" />
                        ) : (
                            <Play className="w-7 h-7 ml-1" />
                        )}
                    </button>

                    {/* Skip Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                                }
                            }}
                            className="w-10 h-10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
                            title="Skip back 10s"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 30);
                                }
                            }}
                            className="w-10 h-10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
                            title="Skip forward 30s"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Center: Time and Progress */}
                <div className="flex-1 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-fit">
                        {formatTime(currentTime)}
                    </span>
                    <div className="flex-1 relative h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden cursor-pointer group" onClick={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        if (audioRef.current) {
                            audioRef.current.currentTime = percent * duration;
                        }
                    }}>
                        <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-blue-400 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                        />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-fit">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Right: Volume Control */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleMuteToggle}
                        className="flex-shrink-0 w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        {isMuted ? (
                            <VolumeX className="w-6 h-6" />
                        ) : (
                            <Volume2 className="w-6 h-6" />
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-2 bg-gray-300 dark:bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
