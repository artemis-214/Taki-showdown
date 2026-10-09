'use client';

import React, { useEffect, useState } from 'react';
import { SoundManager } from '../audio/SoundManager';

interface DefeatScreenProps {
  bossName: string;
  defeatDialogue: string;
  stats: {
    damageDealt: number;
    turnsTaken: number;
    criticalHits: number;
  };
  onRetry: () => void;
  onChangeTeam: () => void;
  onExit: () => void;
}

export const DefeatScreen: React.FC<DefeatScreenProps> = ({
  bossName,
  defeatDialogue,
  stats,
  onRetry,
  onChangeTeam,
  onExit,
}) => {
  const [countdown, setCountdown] = useState(9);

  useEffect(() => {
    // Play defeat sound on mount
    SoundManager.playDefeatJingle();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          SoundManager.playBlip();
          return prev - 1;
        }
        clearInterval(interval);
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-panel-dark border-4 border-arcade-red shadow-pixel-lg text-center max-w-xl mx-auto my-6 animate-shake">
      {/* Flashing Retro Game Over Banner */}
      <div className="inline-block px-4 py-1 bg-arcade-red text-black font-arcade text-xs mb-3 font-bold tracking-widest animate-pulse">
        ★ SQUAD WIPED OUT ★
      </div>

      <h2 className="font-arcade text-3xl md:text-4xl text-arcade-red drop-shadow-[0_0_12px_rgba(255,77,109,0.8)] mb-2">
        GAME OVER
      </h2>

      {/* Arcade Countdown Marquee */}
      <div className="my-4 p-4 bg-black border-4 border-arcade-red/50 shadow-pixel w-full">
        <div className="font-arcade text-[10px] text-arcade-steel mb-1">CONTINUE?</div>
        <div
          className={`font-arcade text-5xl md:text-6xl font-bold ${
            countdown <= 3 ? 'text-arcade-red animate-ping' : 'text-arcade-amber animate-pulse'
          }`}
        >
          {countdown > 0 ? countdown : '0'}
        </div>
      </div>

      {/* Boss Mocking Dialogue */}
      <div className="p-3 bg-panel-raised border-2 border-black w-full mb-4">
        <div className="font-arcade text-[10px] text-arcade-magenta mb-1">{bossName.toUpperCase()} SAYS:</div>
        <p className="font-retro text-lg md:text-xl text-arcade-text italic leading-tight">
          "{defeatDialogue}"
        </p>
      </div>

      {/* Combat Recap */}
      <div className="grid grid-cols-3 gap-2 w-full p-2 bg-black border border-arcade-steel/40 font-retro text-sm text-arcade-steel mb-6">
        <div>
          <div>TURNS SURVIVED</div>
          <div className="text-arcade-cyan font-arcade text-xs mt-0.5">{stats.turnsTaken}</div>
        </div>
        <div>
          <div>DAMAGE DEALT</div>
          <div className="text-arcade-amber font-arcade text-xs mt-0.5">{stats.damageDealt}</div>
        </div>
        <div>
          <div>CRIT STRIKES</div>
          <div className="text-arcade-red font-arcade text-xs mt-0.5">{stats.criticalHits}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
        <button
          onClick={onRetry}
          className="flex-1 py-3 px-4 border-4 border-black bg-arcade-amber text-black font-arcade text-xs shadow-pixel hover:bg-yellow-400 active:translate-y-1 transition-all"
        >
          INSERT COIN (RETRY)
        </button>
        <button
          onClick={onChangeTeam}
          className="flex-1 py-3 px-4 border-4 border-black bg-panel-raised text-arcade-cyan font-arcade text-xs shadow-pixel hover:bg-panel-dark active:translate-y-1 transition-all"
        >
          CHANGE SQUAD
        </button>
        <button
          onClick={onExit}
          className="flex-1 py-3 px-4 border-4 border-black bg-panel-raised text-arcade-steel font-arcade text-xs shadow-pixel hover:bg-panel-dark active:translate-y-1 transition-all"
        >
          HUB
        </button>
      </div>
    </div>
  );
};