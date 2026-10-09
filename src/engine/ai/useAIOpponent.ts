import { TurnAction, BattleAuthoritativeState } from '../turnResolver';
import { MoveData } from '../../data/types';
import { calculateDamage } from '../damageCalculator';
import { AIDifficulty } from '../../lib/storage';

export function selectAIAction(
  state: BattleAuthoritativeState,
  difficulty: AIDifficulty,
  moveMap: Map<string, MoveData>,
  rng = Math.random
): TurnAction {
  const ai = state.opponent;
  const player = state.player;
  const activeFighter = ai.team[ai.activeIdx]!;
  const playerFighter = player.team[player.activeIdx]!;

  const legalMoveIds = activeFighter.moves.filter((id) => (activeFighter.currentPp[id] ?? 1) > 0);
  if (legalMoveIds.length === 0) return { type: 'switch', targetFighterIndex: (ai.activeIdx + 1) % 3 };

  if (difficulty === 'easy') {
    if (rng() < 0.7) {
      return { type: 'move', moveId: legalMoveIds[Math.floor(rng() * legalMoveIds.length)]! };
    }
    const bestPowerMove = legalMoveIds.reduce((prev, curr) => {
      const prevPow = moveMap.get(prev)?.power ?? 0;
      const currPow = moveMap.get(curr)?.power ?? 0;
      return currPow > prevPow ? curr : prev;
    }, legalMoveIds[0]!);
    return { type: 'move', moveId: bestPowerMove };
  }

  if (difficulty === 'medium') {
    const hpRatio = activeFighter.currentHp / activeFighter.stats.maxHp;
    if (hpRatio < 0.3) {
      const defensiveMove = legalMoveIds.find((id) => {
        const m = moveMap.get(id);
        return m?.effect.kind === 'heal' || m?.effect.kind === 'shield';
      });
      if (defensiveMove) return { type: 'move', moveId: defensiveMove };
    }
    let bestMoveId = legalMoveIds[0]!;
    let maxExpectedDamage = -1;
    for (const moveId of legalMoveIds) {
      const move = moveMap.get(moveId);
      if (!move) continue;
      const dmg = calculateDamage(activeFighter, playerFighter, move, 0.95, false);
      const ev = dmg.damage * (move.accuracy / 100);
      if (ev > maxExpectedDamage) {
        maxExpectedDamage = ev;
        bestMoveId = moveId;
      }
    }
    return { type: 'move', moveId: bestMoveId };
  }

  let bestScore = -Infinity;
  let chosenAction: TurnAction = { type: 'move', moveId: legalMoveIds[0]! };

  for (const moveId of legalMoveIds) {
    const move = moveMap.get(moveId);
    if (!move) continue;
    let score = 0;
    const dmg = calculateDamage(activeFighter, playerFighter, move, 0.92, false);
    if (dmg.damage >= playerFighter.currentHp + playerFighter.currentShield) score += 5000;
    score += dmg.damage * 1.5;
    if (move.effect.kind === 'heal') score += (activeFighter.stats.maxHp - activeFighter.currentHp) * 2;
    if (score > bestScore) {
      bestScore = score;
      chosenAction = { type: 'move', moveId };
    }
  }
  return chosenAction;
}
