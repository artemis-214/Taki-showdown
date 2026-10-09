'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArcadeCabinet } from '../../components/battle/ArcadeCabinet';
import { BattleArena } from '../../components/battle/BattleArena';
import { VictoryScreen } from '../../components/battle/VictoryScreen';
import { SoundManager } from '../../components/audio/SoundManager';
import { BattleAuthoritativeState, resolveTurn, BattleSideState } from '../../engine/turnResolver';
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

  const moveMap = useMemo(() => new Map<string, MoveData>(movesRaw.map((m) => [m.id, m as MoveData])), []);
  const fighterMap = useMemo(() => new Map<string, FighterData>(fightersRaw.map((f) => [f.id, f as FighterData])), []);

  // Hydrate from localStorage on client mount
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

  const executeTurnAction = (action: { type: 'move'; moveId: string } | { type: 'switch'; targetFighterIndex: number }) => {
    if (!battleState || battleState.isOver || !campaign) return;

    SoundManager.playConfirm();
    const aiAction = selectAIAction(battleState, campaign.difficulty, moveMap);
    const { nextState, events } = resolveTurn(battleState, action, aiAction, moveMap);

    const newLogs: string[] = [];
    events.forEach((ev) => {
      if (ev.type === 'move_used') {
        newLogs.push(`${ev.fighterName} used ${ev.moveName}!`);
      } else if (ev.type === 'damage_dealt') {
        if (ev.isCritical) {
          SoundManager.playCrit();
          setShake(true);
          setTimeout(() => setShake(false), 250);
        } else {
          SoundManager.playHit();
        }
        newLogs.push(`-> ${ev.damage} dmg to ${ev.targetName}${ev.isCritical ? ' (CRITICAL!)' : ''}`);
      } else if (ev.type === 'shield_applied') {
        SoundManager.playShield();
        newLogs.push(`-> ${ev.fighterName} generated +${ev.amount} overshield!`);
      } else if (ev.type === 'healed') {
        SoundManager.playHeal();
        newLogs.push(`-> ${ev.fighterName} healed for +${ev.amount} HP!`);
      } else if (ev.type === 'fighter_fainted') {
        SoundManager.playFaint();
        newLogs.push(`[!] ${ev.fighterName} fainted!`);
      } else if (ev.type === 'replacement_sent_out') {
        newLogs.push(`>> ${ev.fighterName} entered the fray!`);
      }
    });

    setBattleState(nextState);
    setLogs((prev) => [...prev, ...newLogs]);
  };

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
        <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
          <Link href="/" className="font-arcade text-xs text-arcade-steel hover:text-arcade-cyan">
            &lt; HUB
          </Link>
          <div className="font-arcade text-xs text-arcade-amber">
            STAGE 1: {encountersRaw[0]!.name.toUpperCase()} (TURN {battleState.turnNumber})
          </div>
        </div>

        {battleState.isOver && battleState.winner === 'player' ? (
          <VictoryScreen
            stats={{ ...battleState.stats, turnsTaken: battleState.turnNumber }}
            onPlayAgain={() => window.location.reload()}
            onExit={() => (window.location.href = '/')}
          />
        ) : (
          <>
            <BattleArena
              state={battleState}
              moveMap={moveMap}
              onSelectMove={(moveId) => executeTurnAction({ type: 'move', moveId })}
              onSwitch={(idx) => executeTurnAction({ type: 'switch', targetFighterIndex: idx })}
              disabled={battleState.isOver}
            />

            <div className="mt-6 border-4 border-black bg-panel-dark p-3 max-h-36 overflow-y-auto font-retro text-lg text-arcade-steel flex flex-col gap-1">
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