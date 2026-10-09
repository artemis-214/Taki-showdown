import React from 'react';

export const ShieldBar: React.FC<{ current: number }> = ({ current }) => (
  <div className="w-full">
    <div className="flex justify-between text-xs font-arcade text-[10px] text-arcade-cyan mb-1">
      <span>OVERSHIELD</span>
      <span>+{current}</span>
    </div>
    <div className="h-2 w-full border-2 border-black bg-black p-0.5">
      <div className="h-full bg-arcade-cyan transition-all duration-300" style={{ width: '100%' }} />
    </div>
  </div>
);
