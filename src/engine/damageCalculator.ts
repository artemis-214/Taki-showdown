import typeChartData from '../data/typeChart.json';
import { FighterType, RuntimeFighterState, MoveData } from '../data/types';

const typeChart: Record<string, Record<string, number>> = typeChartData;

export function calculateTypeMultiplier(attackerType: FighterType, defenderTypes: FighterType[]): number {
  let multiplier = 1.0;
  const attackRelations = typeChart[attackerType];
  if (!attackRelations) return multiplier;
  for (const defType of defenderTypes) {
    if (attackRelations[defType] !== undefined) multiplier *= attackRelations[defType]!;
  }
  return multiplier;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  typeMultiplier: number;
  absorbedByShield: number;
  actualHpLost: number;
}

export function calculateDamage(
  attacker: RuntimeFighterState,
  defender: RuntimeFighterState,
  move: MoveData,
  rngSeedFactor = Math.random(),
  forceCrit?: boolean
): DamageResult {
  if (move.power <= 0) {
    return { damage: 0, isCritical: false, typeMultiplier: 1.0, absorbedByShield: 0, actualHpLost: 0 };
  }
  const attackStat = Math.max(1, attacker.stats.attack * Math.pow(1.5, attacker.statStages.attack));
  const defenseStat = Math.max(1, defender.stats.defense * Math.pow(1.5, defender.statStages.defense));
  const baseDamage = Math.floor((((2 * attacker.level) / 5 + 2) * move.power * (attackStat / defenseStat)) / 50 + 2);
  const typeMultiplier = calculateTypeMultiplier(move.type, defender.types);
  const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
  const isCritical = forceCrit !== undefined ? forceCrit : rngSeedFactor < 0.1;
  const criticalMultiplier = isCritical ? 1.5 : 1.0;
  const randomFactor = 0.85 + (rngSeedFactor % 0.15);
  let burnPenalty = (attacker.status === 'burn' && move.category === 'physical') ? 0.5 : 1.0;

  const rawFinalDamage = Math.max(1, Math.floor(baseDamage * typeMultiplier * stab * criticalMultiplier * randomFactor * burnPenalty));
  let absorbed = 0;
  let remainingDamage = rawFinalDamage;

  if (defender.currentShield > 0) {
    if (defender.currentShield >= rawFinalDamage) {
      absorbed = rawFinalDamage;
      remainingDamage = 0;
    } else {
      absorbed = defender.currentShield;
      remainingDamage = rawFinalDamage - defender.currentShield;
    }
  }

  return { damage: rawFinalDamage, isCritical, typeMultiplier, absorbedByShield: absorbed, actualHpLost: remainingDamage };
}
