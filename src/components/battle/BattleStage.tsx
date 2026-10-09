'use client';

import React from 'react';
import { RuntimeFighterState } from '../../data/types';

export interface CombatPopup {
  id: string;
  targetSide: 'player' | 'opponent';
  text: string;
  type: 'damage' | 'critical' | 'heal' | 'shield' | 'status';
}

interface BattleStageProps {
  playerFighter: RuntimeFighterState;
  opponentFighter: RuntimeFighterState;
  playerActionState: 'idle' | 'attacking' | 'hit' | 'fainted';
  opponentActionState: 'idle' | 'attacking' | 'hit' | 'fainted';
  popups: CombatPopup[];
}

export const BattleStage: React.FC<BattleStageProps> = ({
  playerFighter,
  opponentFighter,
  playerActionState,
  opponentActionState,
  popups,
}) => {
  return (
    <div className="relative w-full h-64 md:h-72 border-4 border-black bg-gradient-to-b from-panel-raised to-panel-dark overflow-hidden shadow-pixel">
      {/* Retro Grid Floor Perspective */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(to_bottom,rgba(85,231,255,0.08)_1px,transparent_1px),linear-gradient(to_right,rgba(85,231,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px] [transform:perspective(250px)_rotateX(45deg)] border-t-2 border-arcade-cyan/30" />

      {/* Floating Combat Popups */}
      {popups.map((p) => {
        const isPlayer = p.targetSide === 'player';
        let colorClass = 'text-arcade-red';
        if (p.type === 'critical') colorClass = 'text-arcade-amber font-bold text-base md:text-lg animate-bounce';
        if (p.type === 'heal') colorClass = 'text-arcade-green';
        if (p.type === 'shield') colorClass = 'text-arcade-cyan';

        return (
          <div
            key={p.id}
            className={`absolute z-30 font-arcade text-xs md:text-sm animate-float-fade ${colorClass} ${
              isPlayer ? 'bottom-28 left-16 md:left-28' : 'bottom-36 right-16 md:right-28'
            }`}
          >
            {p.text}
          </div>
        );
      })}

      {/* Opponent Fighter (Top Right Stage) */}
      <div
        className={`absolute bottom-24 right-10 md:right-24 z-20 flex flex-col items-center transition-all duration-150 ${
          opponentActionState === 'attacking'
            ? '-translate-x-12 translate-y-6 scale-110'
            : opponentActionState === 'hit'
            ? 'translate-x-6 opacity-60 filter brightness-150'
            : opponentActionState === 'fainted'
            ? 'translate-y-8 opacity-0 scale-75'
            : 'animate-idle-bob'
        }`}
      >
        {/* Pixel Sprite Container */}
        <div className="relative w-20 h-20 md:w-24 md:h-24 bg-black border-4 border-arcade-magenta shadow-neon-magenta flex items-center justify-center p-2">
          {/* Symbolic 8-bit glyph */}
          <div className="font-arcade text-3xl md:text-4xl text-arcade-magenta select-none">
            {opponentFighter.avatarSvg === 'crown'
              ? '👑'
              : opponentFighter.avatarSvg === 'helmet'
              ? '🎖️'
              : opponentFighter.avatarSvg === 'nail'
              ? '⚔️'
              : opponentFighter.avatarSvg === 'toque'
              ? '🍳'
              : opponentFighter.avatarSvg === 'web'
              ? '🕸️'
              : '👾'}
          </div>
        </div>
        <div className="mt-1 font-arcade text-[10px] text-arcade-magenta bg-black px-1.5 border border-black shadow-pixel-sm">
          {opponentFighter.name}
        </div>
      </div>

      {/* Player Fighter (Bottom Left Stage) */}
      <div
        className={`absolute bottom-8 left-10 md:left-24 z-20 flex flex-col items-center transition-all duration-150 ${
          playerActionState === 'attacking'
            ? 'translate-x-12 -translate-y-6 scale-110'
            : playerActionState === 'hit'
            ? '-translate-x-6 opacity-60 filter brightness-150'
            : playerActionState === 'fainted'
            ? 'translate-y-8 opacity-0 scale-75'
            : 'animate-idle-bob'
        }`}
      >
        <div className="relative w-24 h-24 md:w-28 md:h-28 bg-black border-4 border-arcade-cyan shadow-neon-cyan flex items-center justify-center p-2">
          <div className="font-arcade text-4xl md:text-5xl text-arcade-cyan select-none">
            {playerFighter.avatarSvg === 'crown'
              ? '👑'
              : playerFighter.avatarSvg === 'helmet'
              ? '🎖️'
              : playerFighter.avatarSvg === 'katana'
              ? '🗡️'
              : playerFighter.avatarSvg === 'web'
              ? '🕸️'
              : playerFighter.avatarSvg === 'crosshair'
              ? '🎯'
              : '⚡'}
          </div>
        </div>
        <div className="mt-1 font-arcade text-[10px] text-arcade-cyan bg-black px-1.5 border border-black shadow-pixel-sm">
          {playerFighter.name}
        </div>
      </div>
    </div>
  );
};