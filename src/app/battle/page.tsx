'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArcadeCabinet } from '../../components/battle/ArcadeCabinet';
import { BattleArena } from '../../components/battle/BattleArena';
import { VictoryScreen } from '../../components/battle/VictoryScreen';
import { DefeatScreen } from '../../components/battle/DefeatScreen';
import { SoundManager } from '../../components/audio/SoundManager';
import { CombatPopup } from '../../components/battle/BattleStage';
import { useBattleControls } from '../../hooks/useBattleControls';
import {
  BattleAuthoritativeState,
  resolveTurn,
  BattleSideState,
} from '../../engine/turnResolver';
import { selectAIAction } from '../../engine/ai/useAIOpponent';
import { MoveData, FighterData, RuntimeFighterState } from '../../data/types';
import fightersRaw from '../../data/defaultRoster.json';
import movesRaw from '../../data/moves.json';
import encountersRaw from '../../data/encounters.json';
import { Storage, CampaignState, GameSettings } from '../../lib/storage';

function createRuntimeFighter(data: FighterData): RuntimeFighterState {
  const currentPp: Record<string, number> = {};
  data.moves.forEach((m) => {
    currentPp[m] = 10;
  });

  return {
    ...data,
    currentHp: data.stats.hp,
    currentShield: 0,
    status: null,
    statusDuration: 0,
    statStages: { attack: 0, defense: 0, speed: 0 },
    currentPp,
    isFainted: false,
  };
}

export default function BattlePage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [campaign, setCampaign] = useState<CampaignState | null>(null);
  const [battleState, setBattleState] = useState<BattleAuthoritativeState | null>(null);
  const [logs, setLogs] = useState<string[]>(['Match started! Ready fighters!']);
  const [shake, setShake] = useState(false);

  // Stage Animation & Floating Combat Text States
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attacking' | 'hit' | 'fainted'>('idle');
  const [opponentAnim, setOpponentAnim] = useState<'idle' | 'attacking' | 'hit' | 'fainted'>('idle');
  const [popups, setPopups] = useState<CombatPopup[]>([]);

  const moveMap = useMemo(() => new Map<string, MoveData>(movesRaw.map((m) => [m.id, m as MoveData])), []);
  const fighterMap = useMemo(() => new Map<string, FighterData>(fightersRaw.map((f) => [f.id, f as FighterData])), []);

  // Hydrate authoritatively on client mount
  useEffect(() => {
    const s = Storage.loadSettings();
    const c = Storage.loadCampaign();
    setSettings(s);
    setCampaign(c);

    const defaultFighter = fightersRaw[0] as FighterData;
    const pFighters = c.selectedTeam.map((id) =>
      createRuntimeFighter(fighterMap.get(id) ?? defaultFighter)
    ) as [RuntimeFighterState, RuntimeFighterState, RuntimeFighterState];

    const currentEncounter = encountersRaw[0]!;
    const eFighters = currentEncounter.enemyTeam.map((id) =>
      createRuntimeFighter(fighterMap.get(id) ?? defaultFighter)
    ) as [RuntimeFighterState, RuntimeFighterState, RuntimeFighterState];

    setBattleState({
      turnNumber: 1,
      player: { team: pFighters, activeIdx: 0 } as BattleSideState,
      opponent: { team: eFighters, activeIdx: 0 } as BattleSideState,
      isOver: false,
      winner: null,
      history: [],
      stats: { damageDealt: 0, criticalHits: 0, fightersLost: 0 },
    });
  }, [fighterMap]);

  // Turn Action Sequencer
  const executeTurnAction = useCallback(
    (action: { type: 'move'; moveId: string } | { type: 'switch'; targetFighterIndex: number }) => {
      if (!battleState || battleState.isOver || !campaign) return;

      SoundManager.playConfirm();
      const aiAction = selectAIAction(battleState, campaign.difficulty, moveMap);
      const { nextState, events } = resolveTurn(battleState, action, aiAction, moveMap);

      const newLogs: string[] = [];
      const newPopups: CombatPopup[] = [];

      events.forEach((ev) => {
        if (ev.type === 'move_used') {
          newLogs.push(`${ev.fighterName} used ${ev.moveName}!`);
          if (ev.side === 'player') {
            setPlayerAnim('attacking');
            setTimeout(() => setPlayerAnim('idle'), 250);
          } else {
            setOpponentAnim('attacking');
            setTimeout(() => setOpponentAnim('idle'), 250);
          }
        } else if (ev.type === 'damage_dealt') {
          const isPlayerHit = ev.targetSide === 'player';

          if (isPlayerHit) {
            setPlayerAnim('hit');
            setTimeout(() => setPlayerAnim('idle'), 200);
          } else {
            setOpponentAnim('hit');
            setTimeout(() => setOpponentAnim('idle'), 200);
          }

          if (ev.isCritical) {
            SoundManager.playCrit();
            setShake(true);
            setTimeout(() => setShake(false), 250);
            newPopups.push({
              id: `${Date.now()}-crit`,
              targetSide: ev.targetSide,
              text: `CRITICAL! -${ev.damage}`,
              type: 'critical',
            });
          } else {
            SoundManager.playHit();
            newPopups.push({
              id: `${Date.now()}-dmg`,
              targetSide: ev.targetSide,
              text: `-${ev.damage}`,
              type: 'damage',
            });
          }
          newLogs.push(`-> ${ev.damage} dmg to ${ev.targetName}${ev.isCritical ? ' (CRITICAL!)' : ''}`);
        } else if (ev.type === 'shield_applied') {
          SoundManager.playShield();
          newPopups.push({
            id: `${Date.now()}-shd`,
            targetSide: ev.side,
            text: `+${ev.amount} SHIELD`,
            type: 'shield',
          });
          newLogs.push(`-> ${ev.fighterName} generated +${ev.amount} overshield!`);
        } else if (ev.type === 'healed') {
          SoundManager.playHeal();
          newPopups.push({
            id: `${Date.now()}-heal`,
            targetSide: ev.side,
            text: `+${ev.amount} HP`,
            type: 'heal',
          });
          newLogs.push(`-> ${ev.fighterName} healed for +${ev.amount} HP!`);
        } else if (ev.type === 'fighter_fainted') {
          SoundManager.playFaint();
          if (ev.side === 'player') setPlayerAnim('fainted');
          else setOpponentAnim('fainted');
          newLogs.push(`[!] ${ev.fighterName} fainted!`);
        } else if (ev.type === 'replacement_sent_out') {
          newLogs.push(`>> ${ev.fighterName} entered the fray!`);
        }
      });

      setPopups((prev) => [...prev, ...newPopups]);
      setTimeout(() => setPopups([]), 1200);

      setBattleState(nextState);
      setLogs((prev) => [...prev, ...newLogs]);
    },
    [battleState, campaign, moveMap]
  );

  // Keyboard / Gamepad Controller Bindings
  const handleKeyMove = useCallback(
    (index: number) => {
      if (!battleState) return;
      const activeFighter = battleState.player.team[battleState.player.activeIdx]!;
      const moveId = activeFighter.moves[index];
      if (moveId) {
        const curPp = activeFighter.currentPp[moveId] ?? 10;
        if (curPp > 0) executeTurnAction({ type: 'move', moveId });
      }
    },
    [battleState, executeTurnAction]
  );

  const handleKeyBench = useCallback(
    (index: number) => {
      if (!battleState) return;
      if (index !== battleState.player.activeIdx && !battleState.player.team[index]?.isFainted) {
        executeTurnAction({ type: 'switch', targetFighterIndex: index });
      }
    },
    [battleState, executeTurnAction]
  );

  const { focusedIndex, controllerConnected } = useBattleControls({
    onMoveSelect: handleKeyMove,
    onBenchSelect: handleKeyBench,
    enabled: Boolean(battleState && !battleState.isOver),
  });

  if (!battleState || !settings) {
    return (
      <main className="min-h-screen bg-obsidian text-arcade-text flex items-center justify-center font-retro text-2xl">
        LOADING BATTLE ARENA...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-obsidian text-arcade-text p-2 md:p-6 flex flex-col items-center">
      <ArcadeCabinet scanlinesEnabled={settings.scanlinesEnabled} screenShake={shake}>
        {/* Arena Header */}
        <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
          <Link href="/" className="font-arcade text-xs text-arcade-steel hover:text-arcade-cyan transition-colors">
            &lt; HUB
          </Link>
          <div className="font-arcade text-xs text-arcade-amber">
            STAGE 1: {encountersRaw[0]!.name.toUpperCase()} (TURN {battleState.turnNumber})
          </div>
        </div>

        {/* 1. Victory Flow */}
        {battleState.isOver && battleState.winner === 'player' && (
          <VictoryScreen
            stats={{ ...battleState.stats, turnsTaken: battleState.turnNumber }}
            onPlayAgain={() => window.location.reload()}
            onExit={() => (window.location.href = '/')}
          />
        )}

        {/* 2. Defeat Flow */}
        {battleState.isOver && battleState.winner === 'opponent' && (
          <DefeatScreen
            bossName={encountersRaw[0]!.name}
            defeatDialogue={encountersRaw[0]!.defeatDialogue}
            stats={{
              damageDealt: battleState.stats.damageDealt,
              turnsTaken: battleState.turnNumber,
              criticalHits: battleState.stats.criticalHits,
            }}
            onRetry={() => window.location.reload()}
            onChangeTeam={() => (window.location.href = '/team-select')}
            onExit={() => (window.location.href = '/')}
          />
        )}

        {/* 3. Active Battle Interface */}
        {!battleState.isOver && (
          <>
            <BattleArena
              state={battleState}
              moveMap={moveMap}
              onSelectMove={(moveId) => executeTurnAction({ type: 'move', moveId })}
              onSwitch={(idx) => executeTurnAction({ type: 'switch', targetFighterIndex: idx })}
              disabled={battleState.isOver}
              focusedMoveIndex={focusedIndex}
              controllerConnected={controllerConnected}
              playerAnimState={playerAnim}
              opponentAnimState={opponentAnim}
              popups={popups}
            />

            {/* Combat Log Drawer */}
            <div className="mt-4 border-4 border-black bg-panel-dark p-3 max-h-32 overflow-y-auto font-retro text-base md:text-lg text-arcade-steel flex flex-col gap-1">
              {logs.slice(-5).map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </>
        )}
      </ArcadeCabinet>
    </main>
  );
}