import { describe, it, expect } from 'vitest';
import { calculateTypeMultiplier, calculateDamage } from '../engine/damageCalculator';
import { RuntimeFighterState, MoveData } from '../data/types';

describe('Type Effectiveness Calculations', () => {
  it('handles custom multiplier rules accurately', () => {
    expect(calculateTypeMultiplier('Tactical', ['Stealth'])).toBe(2.0);
    expect(calculateTypeMultiplier('Tactical', ['Tank'])).toBe(0.5);
    expect(calculateTypeMultiplier('Birthday', ['Boss'])).toBe(2.0);
    expect(calculateTypeMultiplier('Melee', ['Soul'])).toBe(1.0);
  });
});

describe('Damage Calculations', () => {
  const dummyAttacker: RuntimeFighterState = {
    id: 'jin', name: 'Jin', title: 'Samurai', types: ['Melee'], level: 50,
    stats: { hp: 100, maxHp: 100, attack: 100, defense: 100, speed: 100 },
    spriteUrl: '', avatarSvg: '', moves: ['m1', 'm2', 'm3', 'm4'], abilityId: '',
    dialogue: { intro: '', defeat: '', victory: '' },
    currentHp: 100, currentShield: 0, status: null, statusDuration: 0,
    statStages: { attack: 0, defense: 0, speed: 0 }, currentPp: {}, isFainted: false
  };

  const dummyDefender = structuredClone(dummyAttacker);
  const testMove: MoveData = {
    id: 'm1', name: 'Slash', type: 'Melee', power: 50, accuracy: 100, priority: 0, maxPp: 10,
    category: 'physical', target: 'single_opponent', effect: { kind: 'damage', status: null, statusChance: 0 },
    description: ''
  };

  it('calculates deterministic damage and shields', () => {
    dummyDefender.currentShield = 20;
    const res = calculateDamage(dummyAttacker, dummyDefender, testMove, 0.9, false);
    expect(res.damage).toBeGreaterThan(0);
    expect(res.absorbedByShield).toBe(20);
    expect(res.actualHpLost).toBe(res.damage - 20);
  });
});
