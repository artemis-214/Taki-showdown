'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArcadeCabinet } from '../../components/battle/ArcadeCabinet';
import fightersRaw from '../../data/defaultRoster.json';
import movesRaw from '../../data/moves.json';
import { Storage, CampaignState } from '../../lib/storage';
import { SoundManager } from '../../components/audio/SoundManager';
import { FighterData, MoveData } from '../../data/types';

export default function TeamSelectPage() {
  const [campaign, setCampaign] = useState<CampaignState | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectingFighter, setInspectingFighter] = useState<FighterData | null>(null);

  const fighters = fightersRaw as unknown as FighterData[];
  const moveMap = new Map<string, MoveData>();
  (movesRaw as unknown as MoveData[]).forEach((m) => moveMap.set(m.id, m));

  useEffect(() => {
    const loaded = Storage.loadCampaign();
    setCampaign(loaded);
    setSelectedIds(loaded.selectedTeam || []);
  }, []);

  const toggleSelect = (id: string) => {
    SoundManager.playBlip();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      } else {
        // Replace the last slot if full
        setSelectedIds([selectedIds[0]!, selectedIds[1]!, id]);
      }
    }
  };

  const handleSaveTeam = () => {
    if (selectedIds.length !== 3 || !campaign) return;
    SoundManager.playConfirm();
    const updated: CampaignState = {
      ...campaign,
      selectedTeam: [selectedIds[0]!, selectedIds[1]!, selectedIds[2]!],
    };
    Storage.saveCampaign(updated);
    window.location.href = '/battle';
  };

  const applyPreset = (preset: [string, string, string]) => {
    SoundManager.playConfirm();
    setSelectedIds(preset);
  };

  if (!campaign) {
    return (
      <main className="min-h-screen bg-obsidian text-arcade-text flex items-center justify-center font-retro text-2xl">
        INITIALIZING SQUAD DRAFT...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-obsidian text-arcade-text p-2 md:p-6 flex justify-center">
      <ArcadeCabinet>
        {/* Header Bar */}
        <div className="flex flex-wrap justify-between items-center mb-4 border-b-4 border-black pb-3 gap-2">
          <Link
            href="/"
            onClick={() => SoundManager.playBlip()}
            className="font-arcade text-xs text-arcade-steel hover:text-arcade-cyan transition-colors"
          >
            &lt; ARCADE HUB
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-arcade text-xs text-arcade-cyan">ROSTER DRAFT:</span>
            <span
              className={`font-arcade text-xs px-2 py-0.5 border-2 border-black ${
                selectedIds.length === 3 ? 'bg-arcade-green text-black' : 'bg-arcade-amber text-black'
              }`}
            >
              {selectedIds.length} / 3 SELECTED
            </span>
          </div>
        </div>

        {/* Selected Squad Tray (Active Preview Dock) */}
        <div className="mb-6 p-4 bg-panel-raised border-4 border-black shadow-pixel">
          <div className="font-arcade text-[10px] text-arcade-amber mb-3 tracking-widest uppercase">
            CURRENT COMBAT SQUAD
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[0, 1, 2].map((slotIndex) => {
              const fighterId = selectedIds[slotIndex];
              const fighter = fighters.find((f) => f.id === fighterId);

              return (
                <div
                  key={slotIndex}
                  className={`p-3 border-2 border-black flex flex-col justify-between min-h-[90px] transition-all ${
                    fighter
                      ? 'bg-panel-dark border-arcade-cyan shadow-pixel-sm'
                      : 'bg-black/40 border-dashed border-arcade-steel/50'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-arcade">
                    <span className="text-arcade-steel">SLOT {slotIndex + 1}</span>
                    {fighter && (
                      <button
                        onClick={() => toggleSelect(fighter.id)}
                        className="text-arcade-red hover:underline text-[9px]"
                      >
                        [REMOVE]
                      </button>
                    )}
                  </div>
                  {fighter ? (
                    <div>
                      <div className="font-arcade text-xs text-arcade-cyan mt-1">{fighter.name}</div>
                      <div className="font-retro text-sm text-arcade-steel">{fighter.title}</div>
                      <div className="font-retro text-xs text-arcade-green mt-1">
                        HP {fighter.stats.hp} | ATK {fighter.stats.attack} | SPD {fighter.stats.speed}
                      </div>
                    </div>
                  ) : (
                    <div className="font-retro text-base text-arcade-steel/60 italic self-center my-auto">
                      &lt;EMPTY COMBATANT&gt;
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            <span className="font-retro text-sm text-arcade-steel">QUICK PRESETS:</span>
            <button
              onClick={() => applyPreset(['jin_sakai', 'peter_parker', 'birthday_legend'])}
              className="px-2 py-1 bg-panel-dark border border-black text-[10px] font-arcade hover:border-arcade-cyan text-arcade-text"
            >
              BALANCED TRIO
            </button>
            <button
              onClick={() => applyPreset(['master_chief', 'the_head_chef', 'birthday_legend'])}
              className="px-2 py-1 bg-panel-dark border border-black text-[10px] font-arcade hover:border-arcade-cyan text-arcade-text"
            >
              HEAVY DEFENSE
            </button>
            <button
              onClick={() => applyPreset(['the_knight', 'spike_defuser', 'jin_sakai'])}
              className="px-2 py-1 bg-panel-dark border border-black text-[10px] font-arcade hover:border-arcade-cyan text-arcade-text"
            >
              GLASS CANNON
            </button>
          </div>
        </div>

        {/* Fighter Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {fighters.map((f) => {
            const isChosen = selectedIds.includes(f.id);
            const slotIndex = selectedIds.indexOf(f.id);
            const isTeamFull = selectedIds.length === 3 && !isChosen;

            return (
              <div
                key={f.id}
                onClick={() => toggleSelect(f.id)}
                className={`relative p-4 border-4 transition-all cursor-pointer flex flex-col justify-between ${
                  isChosen
                    ? 'bg-panel-raised border-arcade-cyan shadow-neon-cyan scale-[1.02] ring-2 ring-arcade-cyan'
                    : isTeamFull
                    ? 'bg-panel-dark/70 border-black opacity-60 hover:opacity-90'
                    : 'bg-panel-dark border-black hover:border-arcade-steel shadow-pixel'
                }`}
              >
                {/* Active Selection Badge */}
                {isChosen && (
                  <div className="absolute -top-3 -right-2 bg-arcade-cyan text-black font-arcade text-[10px] px-2 py-0.5 border-2 border-black shadow-pixel-sm font-bold">
                    ✓ SLOT {slotIndex + 1}
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-arcade text-xs text-arcade-text">{f.name}</span>
                    <span className="font-arcade text-[9px] px-1.5 py-0.5 bg-black border border-arcade-steel text-arcade-cyan">
                      {f.types.join('/')}
                    </span>
                  </div>
                  <div className="font-retro text-base text-arcade-amber mb-2">{f.title}</div>
                  <div className="font-retro text-sm text-arcade-steel italic mb-3">"{f.dialogue.intro}"</div>

                  {/* Stat Grid */}
                  <div className="grid grid-cols-4 gap-1 p-2 bg-black/50 border border-black text-center font-retro text-xs">
                    <div>
                      <div className="text-arcade-steel text-[10px]">HP</div>
                      <div className="text-arcade-green font-bold">{f.stats.hp}</div>
                    </div>
                    <div>
                      <div className="text-arcade-steel text-[10px]">ATK</div>
                      <div className="text-arcade-amber font-bold">{f.stats.attack}</div>
                    </div>
                    <div>
                      <div className="text-arcade-steel text-[10px]">DEF</div>
                      <div className="text-arcade-cyan font-bold">{f.stats.defense}</div>
                    </div>
                    <div>
                      <div className="text-arcade-steel text-[10px]">SPD</div>
                      <div className="text-arcade-magenta font-bold">{f.stats.speed}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-black/40">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectingFighter(f);
                    }}
                    className="font-retro text-sm text-arcade-steel hover:text-arcade-cyan underline"
                  >
                    Inspect Moves &gt;
                  </button>

                  <div className="font-arcade text-[10px]">
                    {isChosen ? (
                      <span className="text-arcade-cyan font-bold">[READY]</span>
                    ) : (
                      <span className="text-arcade-steel">[CLICK TO ADD]</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lock In Footer */}
        <div className="flex justify-between items-center border-t-4 border-black pt-4">
          <div className="font-retro text-lg text-arcade-steel">
            {selectedIds.length === 3
              ? 'Squad complete! Ready to enter the multiverse arena.'
              : `Select ${3 - selectedIds.length} more fighter(s) to deploy.`}
          </div>
          <button
            disabled={selectedIds.length !== 3}
            onClick={handleSaveTeam}
            className="px-8 py-4 border-4 border-black bg-arcade-magenta text-black font-arcade text-xs shadow-pixel hover:bg-pink-400 active:translate-y-1 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            LOCK IN TEAM
          </button>
        </div>

        {/* Moves Inspection Modal */}
        {inspectingFighter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-panel-dark border-4 border-arcade-cyan p-6 max-w-lg w-full shadow-pixel-lg">
              <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                <span className="font-arcade text-sm text-arcade-cyan">{inspectingFighter.name} — MOVE POOL</span>
                <button
                  onClick={() => setInspectingFighter(null)}
                  className="font-arcade text-xs text-arcade-red hover:underline"
                >
                  [X]
                </button>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                {inspectingFighter.moves.map((moveId) => {
                  const m = moveMap.get(moveId);
                  if (!m) return null;
                  return (
                    <div key={m.id} className="p-3 bg-panel-raised border-2 border-black">
                      <div className="flex justify-between font-arcade text-xs mb-1">
                        <span className="text-arcade-text">{m.name}</span>
                        <span className="text-arcade-steel">
                          {m.type} | PWR: {m.power || '-'} | ACC: {m.accuracy}%
                        </span>
                      </div>
                      <div className="font-retro text-sm text-arcade-steel">{m.description}</div>
                    </div>
                  );
                })}
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