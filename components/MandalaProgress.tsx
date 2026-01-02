import React from 'react';

interface MandalaProps {
  progress: number; // 0 to 100
}

export const MandalaProgress: React.FC<MandalaProps> = ({ progress }) => {
  // Simple geometric construction for a mandala effect
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Background Mandala Decoration - Ultra thin lines */}
      <div className="absolute inset-0 animate-spin-slow opacity-30 dark:opacity-50">
        <svg className="w-full h-full text-zinc-300 dark:text-white/10" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="2 2" />
          <path d="M50 0 L50 100 M0 50 L100 50" stroke="currentColor" strokeWidth="0.5" />
          <rect x="25" y="25" width="50" height="50" stroke="currentColor" strokeWidth="0.5" fill="none" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" fill="none" />
        </svg>
      </div>

      {/* Progress Ring */}
      <svg className="relative w-full h-full transform -rotate-90">
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-zinc-100 dark:stroke-white/5"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Progress */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#gradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" /> {/* Indigo 500 */}
            <stop offset="100%" stopColor="#a855f7" /> {/* Purple 500 */}
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute text-center flex flex-col items-center">
        <span className="block text-2xl font-light tracking-tight text-zinc-800 dark:text-white/90">{progress}%</span>
      </div>
    </div>
  );
};