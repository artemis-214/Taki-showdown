'use client';
import React, { useEffect } from 'react';
import { SoundManager } from '../audio/SoundManager';

export const VictoryScreen: React.FC<{
  stats: { damageDealt: number; criticalHits: number; fightersLost: number; turnsTaken: number };
  onPlayAgain: () => void;
  onExit: () => void;
}> = ({ stats, onPlayAgain, onExit }) => {
  useEffect(() => { SoundManager.playVictoryFanfare(); }, []);
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-panel-dark border-4 border-arcade-green shadow-pixel-lg text-center max-w-xl mx-auto my-8">
      <h2 className="font-arcade text-2xl md:text-3xl text-arcade-green mb-2">VICTORY ACHIEVED!</h2>
      <p className="font-retro text-xl text-arcade-text mb-6">The Birthday Legend honors your tactical mastery!</p>
      <div className="w-full bg-panel-raised border-2 border-black p-4 mb-6 font-arcade text-xs text-left flex flex-col gap-3">
        <div className="flex justify-between"><span className="text-arcade-steel">TURNS:</span><span className="text-arcade-cyan">{stats.turnsTaken}</span></div>
        <div className="flex justify-between"><span className="text-arcade-steel">DAMAGE:</span><span className="text-arcade-cyan">{stats.damageDealt}</span></div>
      </div>
      <div className="flex gap-4">
        <button onClick={onPlayAgain} className="px-6 py-3 border-4 border-black bg-arcade-green text-black font-arcade text-xs shadow-pixel hover:bg-emerald-400">PLAY AGAIN</button>
        <button onClick={onExit} className="px-6 py-3 border-4 border-black bg-panel-raised text-arcade-text font-arcade text-xs shadow-pixel hover:bg-panel-dark">HUB</button>
      </div>
    </div>
  );
};
