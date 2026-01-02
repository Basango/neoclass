import React from 'react';

// A cultural nod: The Blooming Lotus Loader
export const LotusLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in duration-700">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Core Glow */}
        <div className="absolute inset-0 bg-pink-500/5 dark:bg-pink-500/10 blur-3xl rounded-full animate-pulse-slow"></div>
        
        {/* Petals - CSS rotated divs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-8 h-16 border-[0.5px] border-pink-400/20 dark:border-pink-200/20 bg-gradient-to-t from-pink-500/5 to-transparent rounded-[100%] origin-bottom"
            style={{
              transform: `rotate(${i * 45}deg) translateY(-50%)`,
              animation: `pulse 4s infinite ${i * 0.2}s cubic-bezier(0.4, 0, 0.6, 1)`
            }}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <div
            key={`inner-${i}`}
            className="absolute w-6 h-12 border-[0.5px] border-zinc-400/20 dark:border-white/30 bg-white/20 dark:bg-white/5 rounded-[100%] origin-bottom"
            style={{
              transform: `rotate(${i * 45 + 22.5}deg) translateY(-50%) scale(0.7)`,
            }}
          />
        ))}
        
        <div className="z-10 w-3 h-3 bg-yellow-400/80 dark:bg-yellow-200/80 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-sm font-light text-pink-600 dark:text-pink-200 tracking-[0.2em] uppercase">Processing Wisdom</h3>
        <p className="text-[10px] text-zinc-400 dark:text-white/30 font-light">Identifying concepts...</p>
      </div>
    </div>
  );
};

// The Knowledge Galaxy Loader
export const GalaxyLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in duration-700">
      <div className="relative w-40 h-40">
         {/* Central Star */}
         <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-6 h-6 bg-indigo-500 dark:bg-indigo-400 rounded-full blur-xl animate-pulse"></div>
             <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
         </div>
         
         {/* Orbits - Ultra thin lines */}
         <div className="absolute inset-0 border-[0.5px] border-indigo-900/10 dark:border-indigo-500/10 rounded-full animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.6)]"></div>
         </div>
         <div className="absolute inset-8 border-[0.5px] border-purple-900/10 dark:border-purple-500/10 rounded-full animate-spin" style={{ animationDuration: '8s' }}>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-purple-500 dark:bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
         </div>
         <div className="absolute inset-14 border-[0.5px] border-emerald-900/10 dark:border-emerald-500/10 rounded-full animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
             <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
         </div>
      </div>
       <div className="text-center space-y-2">
        <h3 className="text-sm font-light text-indigo-600 dark:text-indigo-200 tracking-[0.2em] uppercase">Scanning Universe</h3>
        <p className="text-[10px] text-zinc-400 dark:text-white/30 font-light">Translating handwriting to digital...</p>
      </div>
    </div>
  );
};