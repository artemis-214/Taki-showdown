// src/lib/csvLoader.ts
import { FighterData, MoveData } from '../data/types';

export function parseRosterCSV(csvText: string): FighterData[] {
  const lines = csvText.trim().split('\n');
  const [, ...rows] = lines; // skip header

  return rows.map((line) => {
    // Splits by comma while respecting quotes
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const clean = (val: string) => val.replace(/^"|"$/g, '').trim();

    return {
      id: clean(cols[0]!),
      name: clean(cols[1]!),
      title: clean(cols[2]!),
      types: clean(cols[3]!).split(',').map((t) => t.trim()) as any,
      level: parseInt(cols[4]!, 10) || 50,
      stats: {
        hp: parseInt(cols[5]!, 10),
        maxHp: parseInt(cols[5]!, 10),
        attack: parseInt(cols[6]!, 10),
        defense: parseInt(cols[7]!, 10),
        speed: parseInt(cols[8]!, 10),
      },
      spriteUrl: `/sprites/${clean(cols[0]!)}.png`,
      avatarSvg: clean(cols[14] || '👑'),
      moves: clean(cols[9]!).split(',').map((m) => m.trim()) as [string, string, string, string],
      abilityId: clean(cols[10]!),
      dialogue: {
        intro: clean(cols[11]!),
        victory: clean(cols[12]!),
        defeat: clean(cols[13]!),
      },
    };
  });
}