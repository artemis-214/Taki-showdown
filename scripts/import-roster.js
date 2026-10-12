import fs from 'fs';
import path from 'path';

// Checks parent folder first, then current folder
const possiblePaths = [
  path.resolve('../Showdown_Roster_And_Moves_Database - Roster.csv'),
  path.resolve('./Showdown_Roster_And_Moves_Database - Roster.csv'),
  path.resolve('./Showdown_Roster_Moves_Editor_Roster.csv'),
];

const csvPath = possiblePaths.find((p) => fs.existsSync(p));

if (!csvPath) {
  console.error('❌ Could not find CSV file in parent or project folder!');
  process.exit(1);
}

console.log(`📖 Reading roster from: ${csvPath}`);
const rawContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV respecting quoted commas and line breaks
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          cur += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length < headers.length) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  return rows;
}

const parsedRows = parseCSV(rawContent);

// Filter out blank placeholder template rows
const validFighters = parsedRows
  .filter((r) => r.id && r.id.trim() !== '' && r.name && r.name.trim() !== '')
  .map((r) => {
    // Handle both single 'types' or separate primary/secondary columns
    let types = [];
    if (r.primary_type) {
      types.push(r.primary_type.trim());
      if (r.secondary_type && r.secondary_type.trim().toLowerCase() !== 'none') {
        types.push(r.secondary_type.trim());
      }
    } else if (r.types) {
      types = r.types.split(',').map((t) => t.trim());
    } else {
      types = ['Melee'];
    }

    // Handle separate move columns or merged moves
    let moves = [];
    if (r.move_1) {
      moves = [r.move_1, r.move_2, r.move_3, r.move_4].filter(Boolean);
    } else if (r.moves) {
      moves = r.moves.split(',').map((m) => m.trim());
    }

    // Ensure 4 moves
    while (moves.length < 4) {
      moves.push('ghost_stance');
    }

    const hp = parseInt(r.hp, 10) || 120;

    return {
      id: r.id.trim().toLowerCase().replace(/\s+/g, '_'),
      name: r.name.trim(),
      title: r.title ? r.title.trim() : 'Multiverse Combatant',
      types: types,
      level: parseInt(r.level, 10) || 50,
      stats: {
        hp: hp,
        maxHp: hp,
        attack: parseInt(r.attack, 10) || 100,
        defense: parseInt(r.defense, 10) || 100,
        speed: parseInt(r.speed, 10) || 100,
      },
      spriteUrl: `/sprites/${r.id.trim()}.png`,
      avatarSvg: r.avatar_glyph ? r.avatar_glyph.trim() : '⚔️',
      moves: [moves[0], moves[1], moves[2], moves[3]],
      abilityId: r.ability_id ? r.ability_id.trim() : 'standard_aura',
      dialogue: {
        intro: r.intro_dialogue ? r.intro_dialogue.trim() : 'Ready for battle!',
        victory: r.victory_dialogue ? r.victory_dialogue.trim() : 'Victory is mine!',
        defeat: r.defeat_dialogue ? r.defeat_dialogue.trim() : 'Defeated...',
      },
    };
  });

const outputPath = path.resolve('src/data/defaultRoster.json');
fs.writeFileSync(outputPath, JSON.stringify(validFighters, null, 2), 'utf8');

console.log(`✅ Successfully synced ${validFighters.length} fighters to: ${outputPath}`);