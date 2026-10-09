import { RuntimeFighterState, MoveData } from '../data/types';
import { calculateDamage } from './damageCalculator';
import { BattleEvent } from './battleEvents';

export type TurnAction =
  | { type: 'move'; moveId: string }
  | { type: 'switch'; targetFighterIndex: number };

export interface BattleSideState {
  team: [RuntimeFighterState, RuntimeFighterState, RuntimeFighterState];
  activeIdx: number;
}

export interface BattleAuthoritativeState {
  turnNumber: number;
  player: BattleSideState;
  opponent: BattleSideState;
  isOver: boolean;
  winner: 'player' | 'opponent' | null;
  history: BattleEvent[];
  stats: {
    damageDealt: number;
    criticalHits: number;
    fightersLost: number;
  };
}

export function resolveTurn(
  state: BattleAuthoritativeState,
  playerAction: TurnAction,
  opponentAction: TurnAction,
  moveDatabase: Map<string, MoveData>,
  rng = Math.random
): { nextState: BattleAuthoritativeState; events: BattleEvent[] } {
  if (state.isOver) {
    return { nextState: state, events: [] };
  }

  const events: BattleEvent[] = [];
  const nextPlayer = structuredClone(state.player);
  const nextOpponent = structuredClone(state.opponent);
  const nextStats = { ...state.stats };

  events.push({ type: 'turn_started', turnNumber: state.turnNumber });

  // 1. Resolve Manual Switches
  if (playerAction.type === 'switch') {
    const targetIdx = playerAction.targetFighterIndex;
    if (targetIdx !== nextPlayer.activeIdx && !nextPlayer.team[targetIdx]?.isFainted) {
      nextPlayer.activeIdx = targetIdx;
      const f = nextPlayer.team[targetIdx]!;
      events.push({ type: 'fighter_switched', side: 'player', fighterId: f.id, fighterName: f.name });
    }
  }

  if (opponentAction.type === 'switch') {
    const targetIdx = opponentAction.targetFighterIndex;
    if (targetIdx !== nextOpponent.activeIdx && !nextOpponent.team[targetIdx]?.isFainted) {
      nextOpponent.activeIdx = targetIdx;
      const f = nextOpponent.team[targetIdx]!;
      events.push({ type: 'fighter_switched', side: 'opponent', fighterId: f.id, fighterName: f.name });
    }
  }

  // 2. Queue & Order Moves
  interface QueuedAction {
    side: 'player' | 'opponent';
    action: TurnAction;
    speed: number;
    priority: number;
  }

  const queuedActions: QueuedAction[] = [];

  const getEffectiveSpeed = (f: RuntimeFighterState) => {
    let speed = f.stats.speed * Math.pow(1.5, f.statStages.speed);
    if (f.status === 'paralyze') speed *= 0.5;
    return speed;
  };

  if (playerAction.type === 'move') {
    const move = moveDatabase.get(playerAction.moveId);
    const fighter = nextPlayer.team[nextPlayer.activeIdx]!;
    queuedActions.push({
      side: 'player',
      action: playerAction,
      speed: getEffectiveSpeed(fighter),
      priority: move ? move.priority : 0,
    });
  }

  if (opponentAction.type === 'move') {
    const move = moveDatabase.get(opponentAction.moveId);
    const fighter = nextOpponent.team[nextOpponent.activeIdx]!;
    queuedActions.push({
      side: 'opponent',
      action: opponentAction,
      speed: getEffectiveSpeed(fighter),
      priority: move ? move.priority : 0,
    });
  }

  queuedActions.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.speed !== b.speed) return b.speed - a.speed;
    return rng() > 0.5 ? 1 : -1;
  });

  // 3. Execute Actions
  for (const item of queuedActions) {
    const isPlayer = item.side === 'player';
    const attacker = isPlayer
      ? nextPlayer.team[nextPlayer.activeIdx]!
      : nextOpponent.team[nextOpponent.activeIdx]!;
    const defender = isPlayer
      ? nextOpponent.team[nextOpponent.activeIdx]!
      : nextPlayer.team[nextPlayer.activeIdx]!;

    // Abort if attacker fainted earlier this turn
    if (attacker.isFainted) continue;
    // Abort if defender is already knocked out (prevents ghost hits on replacements)
    if (defender.isFainted) continue;

    if (item.action.type === 'move') {
      const move = moveDatabase.get(item.action.moveId);
      if (!move) continue;

      if (attacker.status === 'stun') {
        events.push({
          type: 'action_skipped_status',
          side: item.side,
          fighterName: attacker.name,
          reason: 'stun',
        });
        attacker.status = null; // Stun wears off on turn skipped
        continue;
      }

      if (attacker.status === 'paralyze' && rng() < 0.25) {
        events.push({
          type: 'action_skipped_status',
          side: item.side,
          fighterName: attacker.name,
          reason: 'paralyze',
        });
        continue;
      }

      // Deduct PP safely
      const curPp = attacker.currentPp[move.id] ?? move.maxPp;
      attacker.currentPp[move.id] = Math.max(0, curPp - 1);

      events.push({
        type: 'move_used',
        side: item.side,
        fighterName: attacker.name,
        moveName: move.name,
        moveType: move.type,
      });

      if (rng() * 100 > move.accuracy) {
        events.push({ type: 'move_missed', userSide: item.side, moveName: move.name });
        continue;
      }

      // Attack & Drain
      if (move.effect.kind === 'damage' || move.effect.kind === 'drain') {
        const damageRes = calculateDamage(attacker, defender, move, rng());
        if (defender.currentShield > 0) {
          defender.currentShield = Math.max(0, defender.currentShield - damageRes.absorbedByShield);
        }
        defender.currentHp = Math.max(0, defender.currentHp - damageRes.actualHpLost);

        if (isPlayer) {
          nextStats.damageDealt += damageRes.damage;
          if (damageRes.isCritical) nextStats.criticalHits++;
        }

        events.push({
          type: 'damage_dealt',
          targetSide: isPlayer ? 'opponent' : 'player',
          targetName: defender.name,
          damage: damageRes.damage,
          absorbedByShield: damageRes.absorbedByShield,
          remainingHp: defender.currentHp,
          isCritical: damageRes.isCritical,
          typeMultiplier: damageRes.typeMultiplier,
        });

        if (move.effect.kind === 'drain') {
          const healValue = Math.floor(damageRes.damage * 0.5);
          attacker.currentHp = Math.min(attacker.stats.maxHp, attacker.currentHp + healValue);
          events.push({
            type: 'healed',
            side: item.side,
            fighterName: attacker.name,
            amount: healValue,
            newHp: attacker.currentHp,
          });
        }
      }

      // Self Healing
      if (move.effect.kind === 'heal' && move.effect.healAmount) {
        attacker.currentHp = Math.min(attacker.stats.maxHp, attacker.currentHp + move.effect.healAmount);
        events.push({
          type: 'healed',
          side: item.side,
          fighterName: attacker.name,
          amount: move.effect.healAmount,
          newHp: attacker.currentHp,
        });
      }

      // Overshield
      if (move.effect.kind === 'shield' && move.effect.shieldAmount) {
        attacker.currentShield += move.effect.shieldAmount;
        events.push({
          type: 'shield_applied',
          side: item.side,
          fighterName: attacker.name,
          amount: move.effect.shieldAmount,
          totalShield: attacker.currentShield,
        });
      }

      // Status Infliction
      if (move.effect.status && rng() * 100 <= move.effect.statusChance && !defender.status) {
        defender.status = move.effect.status;
        events.push({
          type: 'status_applied',
          side: isPlayer ? 'opponent' : 'player',
          fighterName: defender.name,
          status: move.effect.status,
        });
      }

      // Check KO
      if (defender.currentHp <= 0) {
        defender.currentHp = 0;
        defender.isFainted = true;
        events.push({
          type: 'fighter_fainted',
          side: isPlayer ? 'opponent' : 'player',
          fighterName: defender.name,
        });
        if (!isPlayer) nextStats.fightersLost++;
      }
    }
  }

  // 4. Burn tick at end of turn
  const checkBurn = (f: RuntimeFighterState, side: 'player' | 'opponent') => {
    if (!f.isFainted && f.status === 'burn') {
      const burnDmg = Math.max(1, Math.floor(f.stats.maxHp * 0.08));
      f.currentHp = Math.max(0, f.currentHp - burnDmg);
      events.push({
        type: 'status_damage',
        side,
        fighterName: f.name,
        status: 'burn',
        damage: burnDmg,
      });
      if (f.currentHp <= 0) {
        f.currentHp = 0;
        f.isFainted = true;
        events.push({ type: 'fighter_fainted', side, fighterName: f.name });
        if (side === 'player') nextStats.fightersLost++;
      }
    }
  };

  checkBurn(nextPlayer.team[nextPlayer.activeIdx]!, 'player');
  checkBurn(nextOpponent.team[nextOpponent.activeIdx]!, 'opponent');

  // 5. Automatic Replacement for Fainted Combatants
  const replaceIfFainted = (sideState: BattleSideState, side: 'player' | 'opponent') => {
    const active = sideState.team[sideState.activeIdx]!;
    if (active.isFainted) {
      const nextHealthyIdx = sideState.team.findIndex((f) => !f.isFainted);
      if (nextHealthyIdx !== -1) {
        sideState.activeIdx = nextHealthyIdx;
        const rep = sideState.team[nextHealthyIdx]!;
        events.push({
          type: 'replacement_sent_out',
          side,
          fighterId: rep.id,
          fighterName: rep.name,
        });
      }
    }
  };

  replaceIfFainted(nextPlayer, 'player');
  replaceIfFainted(nextOpponent, 'opponent');

  // 6. Check Win/Loss
  const playerDefeated = nextPlayer.team.every((f) => f.isFainted);
  const opponentDefeated = nextOpponent.team.every((f) => f.isFainted);

  let isOver = false;
  let winner: 'player' | 'opponent' | null = null;
  if (playerDefeated || opponentDefeated) {
    isOver = true;
    winner = opponentDefeated ? 'player' : 'opponent';
    events.push({
      type: 'battle_concluded',
      winner,
      totalTurns: state.turnNumber,
    });
  }

  return {
    nextState: {
      turnNumber: state.turnNumber + 1,
      player: nextPlayer,
      opponent: nextOpponent,
      isOver,
      winner,
      history: [...state.history, ...events],
      stats: nextStats,
    },
    events,
  };
}