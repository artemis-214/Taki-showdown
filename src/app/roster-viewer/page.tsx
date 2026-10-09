'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ArcadeCabinet } from '../../components/battle/ArcadeCabinet';
import fightersRaw from '../../data/defaultRoster.json';
import movesRaw from '../../data/moves.json';
import { FighterData, MoveData } from '../../data/types';

export default function RosterViewerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const movesMap = new Map<string, MoveData>(movesRaw.map((m) => [m.id, m as MoveData]));
  const filtered = (fightersRaw as unknown as FighterData[]).filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <main className="min-h-screen bg-obsidian text-arcade-text p-4 flex justify-center">
      <ArcadeCabinet>
        <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-2">
          <Link href="/" className="font-arcade text-xs text-arcade-steel hover:text-arcade-cyan">&lt; HUB</Link>
          <span className="font-arcade text-xs text-arcade-amber">ROSTER ARCHIVE</span>
        </div>
        <input type="text" placeholder="Search fighters..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full mb-6 p-3 bg-panel-dark border-4 border-black font-retro text-xl outline-none focus:border-arcade-cyan" />
        <div className="flex flex-col gap-4">
          {filtered.map((f) => (
            <div key={f.id} className="p-4 border-4 border-black bg-panel-dark">
              <div className="flex justify-between items-center mb-2"><span className="font-arcade text-sm text-arcade-cyan">{f.name}</span><span className="font-arcade text-xs text-arcade-steel">{f.types.join('/')}</span></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                {f.moves.map((mId) => <div key={mId} className="bg-panel-raised p-2 border border-black font-retro text-sm"><div className="font-arcade text-[10px] text-arcade-text">{movesMap.get(mId)?.name}</div><div className="text-arcade-steel">PWR: {movesMap.get(mId)?.power || '-'}</div></div>)}
              </div>
            </div>
          ))}
        </div>
      </ArcadeCabinet>
    </main>
  );
}
