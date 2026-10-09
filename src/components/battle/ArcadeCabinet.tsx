'use client';
import React from 'react';

export const ArcadeCabinet: React.FC<{ children: React.ReactNode; scanlinesEnabled?: boolean; screenShake?: boolean }> = ({
  children,
  scanlinesEnabled = true,
  screenShake = false,
}) => (
  <div className="relative mx-auto w-full max-w-6xl p-2 md:p-6 select-none">
    <div className="relative rounded-lg border-4 border-black bg-panel-dark p-3 md:p-6 shadow-pixel-lg">
      <div className={`relative overflow-hidden rounded border-4 border-black bg-obsidian transition-transform duration-75 ${screenShake ? 'animate-shake' : ''}`}>
        {scanlinesEnabled && (
          <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-80" aria-hidden="true" />
        )}
        <div className="relative z-10 p-4 md:p-6 text-arcade-text font-retro">{children}</div>
      </div>
    </div>
  </div>
);
