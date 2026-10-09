export type AIDifficulty = 'easy' | 'medium' | 'nightmare';

export interface GameSettings {
  muted: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  scanlinesEnabled: boolean;
  reducedMotion: boolean;
}

export interface CampaignState {
  difficulty: AIDifficulty;
  selectedTeam: [string, string, string];
  clearedEncounters: string[];
  bestScore: number;
}

const SETTINGS_KEY = 'showdown_settings_v1';
const CAMPAIGN_KEY = 'showdown_campaign_v1';

export const Storage = {
  loadSettings(): GameSettings {
    if (typeof window === 'undefined') return { muted: false, masterVolume: 0.7, musicVolume: 0.45, sfxVolume: 0.8, scanlinesEnabled: true, reducedMotion: false };
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : { muted: false, masterVolume: 0.7, musicVolume: 0.45, sfxVolume: 0.8, scanlinesEnabled: true, reducedMotion: false };
    } catch {
      return { muted: false, masterVolume: 0.7, musicVolume: 0.45, sfxVolume: 0.8, scanlinesEnabled: true, reducedMotion: false };
    }
  },
  saveSettings(settings: GameSettings) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
  },
  loadCampaign(): CampaignState {
    if (typeof window === 'undefined') return { difficulty: 'medium', selectedTeam: ['jin_sakai', 'peter_parker', 'birthday_legend'], clearedEncounters: [], bestScore: 0 };
    try {
      const saved = localStorage.getItem(CAMPAIGN_KEY);
      return saved ? JSON.parse(saved) : { difficulty: 'medium', selectedTeam: ['jin_sakai', 'peter_parker', 'birthday_legend'], clearedEncounters: [], bestScore: 0 };
    } catch {
      return { difficulty: 'medium', selectedTeam: ['jin_sakai', 'peter_parker', 'birthday_legend'], clearedEncounters: [], bestScore: 0 };
    }
  },
  saveCampaign(state: CampaignState) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(state)); } catch {}
  }
};
