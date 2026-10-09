'use client';
import React from 'react';
import { BattleAuthoritativeState } from '../../engine/turnResolver';
import { MoveData } from '../../data/types';
import { HealthBar } from './HealthBar';
import { ShieldBar } from './ShieldBar';

interface BattleArenaProps {
  state: BattleAuthoritativeState;
  moveMap: Map<string, MoveData>;
  onSelectMove: (moveId: string) => void;
  onSwitch: (idx: number) => void;
  disabled: boolean;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  state,
  moveMap,
  onSelectMove,
  onSwitch,
  disabled,
}) => {
  const player = state.player.team[state.player.activeIdx]!;
  const opponent = state.opponent.team[state.opponent.activeIdx]!;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-panel-raised p-4 border-4 border-black shadow-pixel">
        <div className="flex flex-col gap-2 border-b-2 md:border-b-0 md:border-r-2 border-black/40 p-2">
          <div className="flex justify-between items-center font-arcade text-xs">
            <span className="text-arcade-magenta">{opponent.name}</span>
            <span className="text-arcade-steel">LV {opponent.level}</span>
          </div>
          <HealthBar current={opponent.currentHp} max={opponent.stats.maxHp} />
          {opponent.currentShield > 0 && <ShieldBar current={opponent.currentShield} />}
        </div>
        <div className="flex flex-col gap-2 p-2">
          <div className="flex justify-between items-center font-arcade text-xs">
            <span className="text-arcade-cyan">{player.name}</span>
            <span className="text-arcade-steel">LV {player.level}</span>
          </div>
          <HealthBar current={player.currentHp} max={player.stats.maxHp} />
          {player.currentShield > 0 && <ShieldBar current={player.currentShield} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {player.moves.map((moveId) => {
            const move = moveMap.get(moveId);
            if (!move) return null;
            const currentPp = player.currentPp[moveId] ?? move.maxPp;
            return (
              <button
                key={moveId}
                disabled={disabled || currentPp <= 0}
                onClick={() => onSelectMove(moveId)}
                className="flex flex-col justify-between p-3 border-4 border-black bg-panel-dark shadow-pixel hover:bg-panel-raised disabled:opacity-40"
              >
                <span className="text-arcade-text font-arcade text-xs text-left">{move.name}</span>
                <span className="text-arcade-steel text-xs text-left font-retro mt-1">PP: {currentPp}/{move.maxPp}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 p-3 border-4 border-black bg-panel-dark shadow-pixel">
          <span className="font-arcade text-xs text-arcade-amber">TACTICAL BENCH</span>
          {state.player.team.map((f, idx) => (
            <button
              key={f.id}
              disabled={disabled || idx === state.player.activeIdx || f.isFainted}
              onClick={() => onSwitch(idx)}
              className="flex justify-between p-2 border-2 border-black text-xs font-arcade text-left bg-panel-dark hover:bg-panel-raised disabled:opacity-30"
            >
              <span className={idx === state.player.activeIdx ? 'text-arcade-cyan' : 'text-arcade-text'}>{f.name}</span>
              <span className="text-arcade-steel">{f.isFainted ? 'FAINTED' : `${f.currentHp} HP`}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
