import React from 'react';

export const HealthBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const percentage = Math.max(0, Math.min(100, Math.floor((current / max) * 100)));
  const colorClass = percentage <= 25 ? 'bg-arcade-red' : percentage <= 50 ? 'bg-arcade-amber' : 'bg-arcade-green';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-arcade mb-1 text-[10px]">
        <span className="text-arcade-steel">HP</span>
        <span>{current} / {max}</span>
      </div>
      <div className="h-4 w-full border-2 border-black bg-black p-0.5 shadow-pixel-sm">
        <div className={`h-full transition-all duration-300 ease-out ${colorClass}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};
