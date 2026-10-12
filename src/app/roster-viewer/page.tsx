'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArcadeCabinet } from '../../components/battle/ArcadeCabinet';
import fightersRaw from '../../data/defaultRoster.json';
import movesRaw from '../../data/moves.json';
import { FighterData, MoveData } from '../../data/types';
import { SoundManager } from '../../components/audio/SoundManager';

export default function RosterViewerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'hp' | 'attack' | 'defense' | 'speed'>('name');
  const [fightersList, setFightersList] = useState<FighterData[]>(fightersRaw as unknown as FighterData[]);
  const [inspectingFighter, setInspectingFighter] = useState<FighterData | null>(null);

  // Map moves for quick lookup (fixed initialization scope bug)
  const movesMap = useMemo(() => {
    const map = new Map<string, MoveData>();
    (movesRaw as unknown as MoveData[]).forEach((m) => map.set(m.id, m));
    return map;
  }, []);

  // Sync latest roster data on mount
  useEffect(() => {
    setFightersList(fightersRaw as unknown as FighterData[]);
  }, []);

  // Collect all unique types across the current roster
  const availableTypes = useMemo(() => {
    const typesSet = new Set<string>();
    fightersList.forEach((f) => {
      f.types.forEach((t) => typesSet.add(t));
    });
    return ['ALL', ...Array.from(typesSet)];
  }, [fightersList]);

  // Filter and sort roster
  const filteredAndSorted = useMemo(() => {
    return fightersList
      .filter((f) => {
        const matchesSearch =
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === 'ALL' || f.types.includes(selectedType as any);
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return b.stats[sortBy] - a.stats[sortBy];
      });
  }, [fightersList, searchTerm, selectedType, sortBy]);

  // Direct CSV upload to preview real-time edits without restarting server
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const [, ...rows] = lines;

      const parsed: FighterData[] = rows
        .map((line) => {
          const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (!cols[0]) return null;

          const primary = cols[3] || 'Melee';
          const secondary = cols[4] && cols[4].toLowerCase() !== 'none' ? cols[4] : null;
          const types = secondary ? [primary, secondary] : [primary];
          const hp = parseInt(cols[6] || cols[5], 10) || 120;

          return {
            id: cols[0],
            name: cols[1] || cols[0],
            title: cols[2] || 'Multiverse Combatant',
            types: types as any,
            level: parseInt(cols[5], 10) || 50,
            stats: {
              hp,
              maxHp: hp,
              attack: parseInt(cols[7], 10) || 100,
              defense: parseInt(cols[8], 10) || 100,
              speed: parseInt(cols[9], 10) || 100,
            },
            spriteUrl: `/sprites/${cols[0]}.png`,
            avatarSvg: cols[18] || cols[14] || '⚔️',
            moves: [
              cols[10] || 'ghost_stance',
              cols[11] || 'shadow_parry',
              cols[12] || 'vandal_burst',
              cols[13] || 'pinata_smash',
            ],
            abilityId: cols[14] || 'standard_aura',
            dialogue: {
              intro: cols[15] || 'Ready for battle!',
              victory: cols[16] || 'Victory is ours!',
              defeat: cols[17] || 'Defeated...',
            },
          };
        })
        .filter(Boolean) as FighterData[];

      if (parsed.length > 0) {
        SoundManager.playConfirm();
        setFightersList(parsed);
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen bg-obsidian text-arcade-text p-2 md:p-6 flex justify-center">
      <ArcadeCabinet>
        {/* Navigation Bar */}
        <div className="flex flex-wrap justify-between items-center mb-6 border-b-4 border-black pb-3 gap-2">
          <Link
            href="/"
            onClick={() => SoundManager.playBlip()}
            className="font-arcade text-xs text-arcade-steel hover:text-arcade-cyan transition-colors"
          >
            &lt; HUB
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-arcade text-xs text-arcade-amber">ROSTER ARCHIVE</span>
            <span className="font-arcade text-[10px] bg-panel-dark px-2 py-0.5 border border-arcade-steel text-arcade-cyan">
              {filteredAndSorted.length} FIGHTERS
            </span>
          </div>
        </div>

        {/* Filter & Controls Panel */}
        <div className="mb-6 p-4 bg-panel-raised border-4 border-black shadow-pixel flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search by name, title, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:flex-1 p-2 bg-panel-dark border-2 border-black font-retro text-lg text-arcade-text outline-none focus:border-arcade-cyan"
            />

            {/* Direct CSV Loader */}
            <label className="cursor-pointer px-3 py-2 bg-panel-dark border-2 border-black text-arcade-cyan font-arcade text-[10px] hover:border-arcade-cyan shadow-pixel-sm whitespace-nowrap">
              📁 LOAD CSV DIRECTLY
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-between pt-2 border-t border-black/40 text-xs font-retro">
            {/* Type Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-arcade-steel font-arcade text-[10px]">TYPE:</span>
              {availableTypes.slice(0, 8).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    SoundManager.playBlip();
                    setSelectedType(t);
                  }}
                  className={`px-2 py-0.5 border text-[10px] font-arcade ${
                    selectedType === t
                      ? 'bg-arcade-cyan text-black border-arcade-cyan font-bold'
                      : 'bg-panel-dark text-arcade-steel border-black hover:text-arcade-text'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Sorting Selection */}
            <div className="flex items-center gap-1.5">
              <span className="text-arcade-steel font-arcade text-[10px]">SORT BY:</span>
              {(['name', 'hp', 'attack', 'defense', 'speed'] as const).map((stat) => (
                <button
                  key={stat}
                  onClick={() => {
                    SoundManager.playBlip();
                    setSortBy(stat);
                  }}
                  className={`px-2 py-0.5 border text-[10px] font-arcade uppercase ${
                    sortBy === stat
                      ? 'bg-arcade-amber text-black border-arcade-amber font-bold'
                      : 'bg-panel-dark text-arcade-steel border-black hover:text-arcade-text'
                  }`}
                >
                  {stat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fighter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((f) => (
            <div
              key={f.id}
              className="p-4 border-4 border-black bg-panel-dark shadow-pixel flex flex-col justify-between hover:border-arcade-steel transition-all"
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl select-none">{f.avatarSvg || '⚔️'}</span>
                    <span className="font-arcade text-xs text-arcade-cyan">{f.name}</span>
                  </div>
                  <span className="font-arcade text-[9px] px-1.5 py-0.5 bg-black border border-arcade-steel text-arcade-text">
                    {f.types.join('/')}
                  </span>
                </div>
                <div className="font-retro text-base text-arcade-amber mb-1">{f.title}</div>
                <div className="font-retro text-xs text-arcade-steel italic mb-3">"{f.dialogue.intro}"</div>

                {/* Base Stats */}
                <div className="grid grid-cols-4 gap-1 p-2 bg-black/60 border border-black text-center font-retro text-xs mb-3">
                  <div>
                    <span className="text-arcade-steel text-[10px]">HP</span>
                    <div className="text-arcade-green font-bold">{f.stats.hp}</div>
                  </div>
                  <div>
                    <span className="text-arcade-steel text-[10px]">ATK</span>
                    <div className="text-arcade-amber font-bold">{f.stats.attack}</div>
                  </div>
                  <div>
                    <span className="text-arcade-steel text-[10px]">DEF</span>
                    <div className="text-arcade-cyan font-bold">{f.stats.defense}</div>
                  </div>
                  <div>
                    <span className="text-arcade-steel text-[10px]">SPD</span>
                    <div className="text-arcade-magenta font-bold">{f.stats.speed}</div>
                  </div>
                </div>

                {/* Moves List Preview */}
                <div className="grid grid-cols-2 gap-1.5">
                  {f.moves.map((mId) => {
                    const move = movesMap.get(mId);
                    return (
                      <div
                        key={mId}
                        className="p-1.5 bg-panel-raised border border-black font-retro text-xs flex flex-col"
                      >
                        <span className="font-arcade text-[9px] text-arcade-text truncate">
                          {move?.name || mId}
                        </span>
                        <span className="text-[10px] text-arcade-steel">
                          {move?.type || 'Standard'} | PWR {move?.power || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingFighter(f)}
                className="mt-3 pt-2 border-t border-black/40 font-retro text-sm text-arcade-steel hover:text-arcade-cyan text-left underline"
              >
                Inspect Dialogue & Ability &gt;
              </button>
            </div>
          ))}
        </div>

        {filteredAndSorted.length === 0 && (
          <div className="text-center py-12 font-retro text-xl text-arcade-steel">
            NO FIGHTERS MATCHED THE GIVEN FILTER.
          </div>
        )}

        {/* Detailed Inspection Modal */}
        {inspectingFighter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-panel-dark border-4 border-arcade-cyan p-6 max-w-lg w-full shadow-pixel-lg">
              <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{inspectingFighter.avatarSvg || '⚔️'}</span>
                  <span className="font-arcade text-sm text-arcade-cyan">{inspectingFighter.name}</span>
                </div>
                <button
                  onClick={() => setInspectingFighter(null)}
                  className="font-arcade text-xs text-arcade-red hover:underline"
                >
                  [X]
                </button>
              </div>

              <div className="flex flex-col gap-3 font-retro text-base mb-6">
                <div>
                  <span className="text-arcade-steel">ABILITY ID:</span>{' '}
                  <span className="text-arcade-amber font-arcade text-xs">{inspectingFighter.abilityId}</span>
                </div>
                <div className="p-2 bg-panel-raised border border-black">
                  <div className="text-arcade-green font-arcade text-[10px] mb-1">VICTORY QUOTE</div>
                  <div className="italic">"{inspectingFighter.dialogue.victory}"</div>
                </div>
                <div className="p-2 bg-panel-raised border border-black">
                  <div className="text-arcade-red font-arcade text-[10px] mb-1">DEFEAT QUOTE</div>
                  <div className="italic">"{inspectingFighter.dialogue.defeat}"</div>
                </div>
              </div>

              <button
                onClick={() => setInspectingFighter(null)}
                className="w-full py-2 bg-panel-raised border-2 border-black font-arcade text-xs text-arcade-text hover:bg-panel-dark"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </ArcadeCabinet>
    </main>
  );
}