/**
 * 60초 카운트다운 타이머 컴포넌트
 */
'use client';

import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  duration: number; // 초 단위
  isActive: boolean;
  onComplete?: () => void;
}

export default function CountdownTimer({ duration, isActive, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, duration, onComplete]);

  const percentage = (timeLeft / duration) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-700"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ${
              timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-4xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'}`}>
            {timeLeft}
          </span>
        </div>
      </div>
      <span className="text-sm text-gray-400">초 남음</span>
    </div>
  );
}

