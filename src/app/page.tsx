'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArcadeCabinet } from '../components/battle/ArcadeCabinet';
import { Storage, GameSettings } from '../lib/storage';
import { SoundManager } from '../components/audio/SoundManager';
import fightersData from '../data/defaultRoster.json';
import movesData from '../data/moves.json';
import encountersData from '../data/encounters.json';

export default function ArcadeHub() {
  const [settings, setSettings] = useState<GameSettings>(Storage.loadSettings);
  useEffect(() => { Storage.saveSettings(settings); SoundManager.setMute(settings.muted); }, [settings]);

  const handleStartAudio = () => { SoundManager.playConfirm(); SoundManager.startMusic(); };

  return (
    <main className="min-h-screen bg-obsidian text-arcade-text flex items-center justify-center p-4">
      <ArcadeCabinet scanlinesEnabled={settings.scanlinesEnabled}>
        <div className="flex flex-col items-center text-center py-8">
          <div className="inline-block px-3 py-1 bg-arcade-magenta text-black font-arcade text-xs mb-3 animate-pulse">★ BIRTHDAY BOSS RUSH ★</div>
          <h1 className="font-arcade text-3xl md:text-5xl text-arcade-cyan tracking-wider mb-2">SHOWDOWN</h1>
          <h2 className="font-retro text-2xl text-arcade-amber tracking-widest mb-8">MULTIVERSE CLASH — 3v3 BATTLES</h2>
          <div className="grid grid-cols-3 gap-4 w-full max-w-lg mb-8 bg-panel-raised border-2 border-black p-3 font-arcade text-xs">
            <div><div className="text-arcade-steel text-[10px]">FIGHTERS</div><div className="text-arcade-cyan text-sm">{fightersData.length}</div></div>
            <div><div className="text-arcade-steel text-[10px]">MOVES</div><div className="text-arcade-green text-sm">{movesData.length}</div></div>
            <div><div className="text-arcade-steel text-[10px]">ENCOUNTERS</div><div className="text-arcade-amber text-sm">{encountersData.length}</div></div>
          </div>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Link href="/battle" onClick={handleStartAudio} className="py-4 border-4 border-black bg-arcade-magenta text-black font-arcade text-sm shadow-pixel hover:bg-pink-400 text-center">START BATTLE</Link>
            <Link href="/team-select" onClick={() => SoundManager.playBlip()} className="py-3 border-4 border-black bg-panel-raised text-arcade-cyan font-arcade text-xs shadow-pixel text-center">DRAFT TEAM</Link>
            <Link href="/roster-viewer" onClick={() => SoundManager.playBlip()} className="py-3 border-4 border-black bg-panel-raised text-arcade-text font-arcade text-xs shadow-pixel text-center">ROSTER DATABASE</Link>
          </div>
        </div>
      </ArcadeCabinet>
    </main>
  );
}
