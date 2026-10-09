export type FighterType =
  | 'Melee'
  | 'Stealth'
  | 'Soul'
  | 'Tactical'
  | 'Heavy'
  | 'Acrobatic'
  | 'Kinetic'
  | 'Culinary'
  | 'Chaos'
  | 'Birthday'
  | 'Boss'
  | 'Sweeper'
  | 'Tank'
  | 'Caster'
  | 'Cold';

export type StatusAilment = 'burn' | 'paralyze' | 'stun';

export interface MoveEffect {
  kind: 'damage' | 'heal' | 'shield' | 'status' | 'drain' | 'buff';
  status: StatusAilment | null;
  statusChance: number;
  healAmount?: number;
  shieldAmount?: number;
  statModifier?: {
    stat: 'attack' | 'defense' | 'speed';
    stages: number;
  };
}

export interface MoveData {
  id: string;
  name: string;
  type: FighterType;
  power: number;
  accuracy: number;
  priority: number;
  maxPp: number;
  category: 'physical' | 'special' | 'status';
  target: 'single_opponent' | 'self';
  effect: MoveEffect;
  description: string;
}

export interface FighterStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface FighterDialogue {
  intro: string;
  defeat: string;
  victory: string;
}

export interface FighterData {
  id: string;
  name: string;
  title: string;
  types: [FighterType, ...FighterType[]];
  level: number;
  stats: FighterStats;
  spriteUrl: string;
  avatarSvg: string;
  moves: [string, string, string, string];
  abilityId: string;
  dialogue: FighterDialogue;
}

export interface RuntimeFighterState extends FighterData {
  currentHp: number;
  currentShield: number;
  status: StatusAilment | null;
  statusDuration: number;
  statStages: {
    attack: number;
    defense: number;
    speed: number;
  };
  currentPp: Record<string, number>;
  isFainted: boolean;
}

export interface EncounterData {
  id: string;
  stage: number;
  name: string;
  title: string;
  bossFighterId: string;
  enemyTeam: [string, string, string];
  introDialogue: string;
  victoryDialogue: string;
  defeatDialogue: string;
  unlockCondition: {
    kind: 'none' | 'previous_encounter_cleared';
    encounterId?: string;
  };
  rewards: {
    titleId: string;
    scoreBonus: number;
  };
}
