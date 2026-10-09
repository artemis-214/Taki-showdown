'use client';

import React from 'react';
import { BattleAuthoritativeState } from '../../engine/turnResolver';
import { MoveData } from '../../data/types';
import { HealthBar } from './HealthBar';
import { ShieldBar } from './ShieldBar';
import { BattleStage, CombatPopup } from './BattleStage';

interface BattleArenaProps {
  state: BattleAuthoritativeState;
  moveMap: Map<string, MoveData>;
  onSelectMove: (moveId: string) => void;
  onSwitch: (idx: number) => void;
  disabled: boolean;
  focusedMoveIndex: number;
  controllerConnected: boolean;
  playerAnimState: 'idle' | 'attacking' | 'hit' | 'fainted';
  opponentAnimState: 'idle' | 'attacking' | 'hit' | 'fainted';
  popups: CombatPopup[];
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  state,
  moveMap,
  onSelectMove,
  onSwitch,
  disabled,
  focusedMoveIndex,
  controllerConnected,
  playerAnimState,
  opponentAnimState,
  popups,
}) => {
  const player = state.player.team[state.player.activeIdx]!;
  const opponent = state.opponent.team[state.opponent.activeIdx]!;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Interactive 2D Pixel Stage */}
      <BattleStage
        playerFighter={player}
        opponentFighter={opponent}
        playerActionState={playerAnimState}
        opponentActionState={opponentAnimState}
        popups={popups}
      />

      {/* 2. Fighter HUD Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-panel-raised p-3 border-4 border-black shadow-pixel">
        {/* Opponent Mini HUD */}
        <div className="flex flex-col gap-1 border-b-2 md:border-b-0 md:border-r-2 border-black/40 p-2">
          <div className="flex justify-between items-center font-arcade text-xs">
            <span className="text-arcade-magenta">{opponent.name}</span>
            <span className="text-arcade-steel">LV {opponent.level}</span>
          </div>
          <HealthBar current={opponent.currentHp} max={opponent.stats.maxHp} />
          {opponent.currentShield > 0 && <ShieldBar current={opponent.currentShield} />}
        </div>

        {/* Player Mini HUD */}
        <div className="flex flex-col gap-1 p-2">
          <div className="flex justify-between items-center font-arcade text-xs">
            <span className="text-arcade-cyan">{player.name}</span>
            <span className="text-arcade-steel">LV {player.level}</span>
          </div>
          <HealthBar current={player.currentHp} max={player.stats.maxHp} />
          {player.currentShield > 0 && <ShieldBar current={player.currentShield} />}
        </div>
      </div>

      {/* 3. Move Grid & Tactical Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 4-Move Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {player.moves.map((moveId, idx) => {
            const move = moveMap.get(moveId);
            if (!move) return null;
            const currentPp = player.currentPp[moveId] ?? move.maxPp;
            const isOutOfPp = currentPp <= 0;
            const isFocused = focusedMoveIndex === idx;

            return (
              <button
                key={moveId}
                disabled={disabled || isOutOfPp}
                onClick={() => onSelectMove(moveId)}
                className={`relative group flex flex-col justify-between p-3 border-4 transition-all text-left ${
                  isFocused
                    ? 'border-arcade-cyan bg-panel-raised shadow-neon-cyan ring-2 ring-arcade-cyan'
                    : 'border-black bg-panel-dark hover:bg-panel-raised shadow-pixel'
                } active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-30`}
              >
                {/* Hotkey Indicator */}
                <div className="absolute top-1 right-2 font-arcade text-[9px] text-arcade-steel group-hover:text-arcade-cyan">
                  [{idx + 1}]
                </div>

                <div className="font-arcade text-xs text-arcade-text group-hover:text-arcade-cyan">
                  {move.name}
                </div>

                <div className="flex justify-between w-full text-xs text-arcade-steel mt-2 font-retro">
                  <span>
                    {move.type} | PWR: {move.power > 0 ? move.power : '-'}
                  </span>
                  <span>
                    PP: {currentPp}/{move.maxPp}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tactical Bench Switch Deck */}
        <div className="flex flex-col gap-2 p-3 border-4 border-black bg-panel-dark shadow-pixel">
          <div className="flex justify-between items-center">
            <span className="font-arcade text-[10px] text-arcade-amber">BENCH [Q / W / E]</span>
            {controllerConnected && (
              <span className="font-arcade text-[9px] text-arcade-green animate-pulse">GAMEPAD ON</span>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {state.player.team.map((f, idx) => {
              const isActive = idx === state.player.activeIdx;
              const hotkeys = ['Q', 'W', 'E'];

              return (
                <button
                  key={f.id}
                  disabled={disabled || isActive || f.isFainted}
                  onClick={() => onSwitch(idx)}
                  className={`flex justify-between items-center p-2 border-2 border-black text-xs font-arcade text-left transition-all ${
                    isActive
                      ? 'bg-panel-raised border-arcade-cyan'
                      : f.isFainted
                      ? 'bg-black/50 opacity-30 cursor-not-allowed'
                      : 'bg-panel-dark hover:bg-panel-raised hover:border-arcade-steel'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-arcade-steel text-[9px]">[{hotkeys[idx]}]</span>
                    <span className={isActive ? 'text-arcade-cyan' : 'text-arcade-text'}>{f.name}</span>
                  </span>
                  <span className="text-[10px] text-arcade-steel">
                    {f.isFainted ? 'FAINTED' : `${f.currentHp} HP`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};