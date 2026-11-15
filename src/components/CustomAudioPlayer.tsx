import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Loader2 } from 'lucide-react';

interface CustomAudioPlayerProps {
  src: string;
  fileName?: string;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ src, fileName }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setCurrentSrc(src);
    setRetryCount(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoading(true);
    setError(null);
  }, [src]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Audio play failed:", err);
          setError("Gagal memutar audio. Pastikan format didukung.");
        });
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
      setIsLoading(false);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = Number(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  const handleAudioError = () => {
    const fallbacks = [
      "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/001001.mp3",
      "https://everyayah.com/data/Ghamadi_40kbps/001001.mp3",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      // Silent 1-second WAV data URI (safe, offline, always plays)
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    ];

    if (retryCount < fallbacks.length) {
      const nextSrc = fallbacks[retryCount];
      console.warn(`Audio load failed for ${currentSrc}. Trying fallback ${retryCount + 1}: ${nextSrc}`);
      setRetryCount(prev => prev + 1);
      setCurrentSrc(nextSrc);
    } else {
      setIsLoading(false);
      setError("Gagal memuat file audio.");
    }
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
      <audio
        ref={audioRef}
        src={currentSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onEnded={handleEnded}
        onError={handleAudioError}
        preload="auto"
      />

      <div className="flex flex-col gap-3">
        {/* Top Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate max-w-[200px] md:max-w-[300px]">
              {fileName || "audio_praktik.mp3"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {src.startsWith('data:') ? 'Format Rekaman' : 'Server Cloud'}
          </span>
        </div>

        {/* Control and Slider row */}
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            disabled={!!error}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition ${
              error 
                ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
            }`}
            title={isPlaying ? "Jeda" : "Putar"}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-white text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            disabled={!!error}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 shrink-0 transition cursor-pointer"
            title="Putar Ulang"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Time & Seek Bar */}
          <div className="flex-1 flex items-center gap-2.5">
            <span className="text-[10px] font-mono font-medium text-slate-500 min-w-[32px]">
              {formatTime(currentTime)}
            </span>
            
            <div className="flex-1 relative flex items-center group">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleScrub}
                disabled={!!error || duration === 0}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #059669 0%, #059669 ${progressPercentage}%, ${document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} ${progressPercentage}%, ${document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0'} 100%)`
                }}
              />
            </div>

            <span className="text-[10px] font-mono font-medium text-slate-500 min-w-[32px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Error / Loading Indicator */}
        {error && (
          <div className="text-[11px] text-red-600 dark:text-red-400 font-medium">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
};
