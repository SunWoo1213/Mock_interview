/**
 * 오디오 플레이어 컴포넌트
 */
'use client';

import React, { useRef, useState } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export default function AudioPlayer({ audioUrl, onEnded, autoPlay = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlayPause = () => {
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

  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) {
      onEnded();
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        autoPlay={autoPlay}
      />

      <button
        onClick={togglePlayPause}
        className="w-12 h-12 flex items-center justify-center bg-blue-500 hover:bg-primary-600 rounded-full transition-colors"
      >
        {isPlaying ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 4h3v12H6V4zm5 0h3v12h-3V4z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 3.3A1 1 0 005 4v12a1 1 0 001.6.8l8-6a1 1 0 000-1.6l-8-6z" />
          </svg>
        )}
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{formatTime(currentTime)}</span>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

