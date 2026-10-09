import { FighterType, StatusAilment } from '../data/types';

export type BattleEvent =
  | { type: 'turn_started'; turnNumber: number }
  | { type: 'fighter_switched'; side: 'player' | 'opponent'; fighterId: string; fighterName: string }
  | { type: 'move_used'; side: 'player' | 'opponent'; fighterName: string; moveName: string; moveType: FighterType }
  | { type: 'damage_dealt'; targetSide: 'player' | 'opponent'; targetName: string; damage: number; absorbedByShield: number; remainingHp: number; isCritical: boolean; typeMultiplier: number }
  | { type: 'move_missed'; userSide: 'player' | 'opponent'; moveName: string }
  | { type: 'healed'; side: 'player' | 'opponent'; fighterName: string; amount: number; newHp: number }
  | { type: 'shield_applied'; side: 'player' | 'opponent'; fighterName: string; amount: number; totalShield: number }
  | { type: 'status_applied'; side: 'player' | 'opponent'; fighterName: string; status: StatusAilment }
  | { type: 'status_damage'; side: 'player' | 'opponent'; fighterName: string; status: StatusAilment; damage: number }
  | { type: 'action_skipped_status'; side: 'player' | 'opponent'; fighterName: string; reason: StatusAilment }
  | { type: 'fighter_fainted'; side: 'player' | 'opponent'; fighterName: string }
  | { type: 'replacement_sent_out'; side: 'player' | 'opponent'; fighterId: string; fighterName: string }
  | { type: 'battle_concluded'; winner: 'player' | 'opponent'; totalTurns: number };
