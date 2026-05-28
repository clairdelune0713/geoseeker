/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, MapPin, RefreshCw, Eye, Target, Compass, Globe, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../types';
import StreetView from './StreetView';
import { ZONES } from '../constants';

const ADJECTIVES = ['Sneaky', 'Hidden', 'Clever', 'Swift', 'Silent', 'Shadowy', 'Mystic', 'Brave', 'Wandering', 'Lost', 'Curious', 'Invisible', 'Phantom', 'Ghostly'];
const NOUNS = ['Fox', 'Dragon', 'Owl', 'Ninja', 'Ghost', 'Seeker', 'Hunter', 'Panda', 'Tiger', 'Wolf', 'Panther', 'Falcon', 'Raven', 'Leopard'];

function generateName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

const EMOJIS = ['🙈', '🥶', '🔥', '🏃💨', '👀', '🤫'];

interface GameSidebarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function GameSidebar({ isDarkMode, onToggleDarkMode }: GameSidebarProps) {
  const { gameState, playerId, joinGame, startGame, resetGame, setZone, sendReaction } = useGame();
  const [hasJoined, setHasJoined] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const generatedName = generateName();
    const success = await joinGame(generatedName);
    if (success) {
      setHasJoined(true);
    }
  };

  const currentPlayer = gameState?.players[playerId || ''];
  const hiderName = gameState?.hiderId ? gameState.players[gameState.hiderId]?.name : 'Unknown';

  // Sort players by best score (lowest distance)
  const sortedPlayers = gameState
    ? (Object.values(gameState.players) as Player[])
      .filter(p => p.role === 'seeker')
      .sort((a, b) => a.score - b.score)
    : [];

  const showStreetView = gameState?.hiderLocation && (gameState.status === 'seeking' || gameState.status === 'finished');

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center gap-2 font-display">
              <MapPin className="text-blue-600 w-8 h-8" />
              GeoSeeker
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Round {gameState?.round || 1}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
            className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Game Status Banner */}
      {gameState && gameState.status !== 'waiting' && (
        <div className={`px-6 py-5 text-white shadow-inner transition-colors duration-500
          ${gameState?.status === 'hiding' ? 'bg-amber-500' : ''}
          ${gameState?.status === 'seeking' ? 'bg-blue-600' : ''}
          ${gameState?.status === 'finished' ? 'bg-emerald-600' : ''}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {gameState?.status === 'hiding' && (
                <>
                  <Eye className="w-8 h-8 text-white" strokeWidth={1.5} />
                  <div className="leading-tight text-lg font-bold">
                    {hiderName} is hiding...
                  </div>
                </>
              )}
              {gameState?.status === 'seeking' && (
                <>
                  <Target className="w-8 h-8 text-white" strokeWidth={1.5} />
                  <div className="leading-tight text-lg font-bold">
                    Seekers are searching!
                  </div>
                </>
              )}
              {gameState?.status === 'finished' && (
                <>
                  <Trophy className="w-8 h-8 text-white" strokeWidth={1.5} />
                  <div className="leading-tight text-lg font-bold">
                    Round Over!
                  </div>
                </>
              )}
            </div>
            {gameState?.zoneId && (
              <div className="flex items-center gap-3 text-sm bg-slate-800/30 px-5 py-2.5 rounded-3xl">
                <Globe className="w-5 h-5 text-white" strokeWidth={1.5} />
                <div className="leading-tight font-bold">
                  {(() => {
                    const name = ZONES[gameState.zoneId as keyof typeof ZONES]?.name || 'Global';
                    const parts = name.split(' (');
                    if (parts.length > 1) {
                      return (
                        <>
                          <div>{parts[0]}</div>
                          <div>({parts[1]}</div>
                        </>
                      );
                    }
                    return name;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 dark:bg-slate-950">

        {/* Join Form */}
        {!hasJoined && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleJoin}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800"
          >
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 font-display text-xl">Play vs Gemini AI</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">You will be the Seeker. Find where Gemini is hiding!</p>
            <div className="space-y-5">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" />
                Join as Seeker
              </button>
            </div>
          </motion.form>
        )}

        {/* Player Role Card */}
        {hasJoined && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Your Role</p>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300">
                <Target className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-lg">Seeker</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Find where the hider is!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Zone Selector & Start Game Button */}
        {hasJoined && gameState?.status === 'waiting' && Object.keys(gameState?.players || {}).length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                Select Game Zone
              </label>
              <select
                value={gameState.zoneId || 'global'}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-100"
              >
                {Object.values(ZONES).map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-zinc-900/20 dark:shadow-blue-950/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
            >
              <Target className="w-6 h-6" />
              Start Game
            </button>
          </motion.div>
        )}

        {/* Street View */}
        {showStreetView && gameState.hiderLocation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-500" />
              Hider's Location
            </h3>
            <div className="h-64 w-full relative">
              <StreetView location={gameState.hiderLocation} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {gameState?.status === 'finished' && (
          <button
            onClick={resetGame}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            Next Round
          </button>
        )}
        {gameState?.status !== 'finished' && (
          <div className="text-center text-xs text-slate-400 dark:text-slate-500">
            Waiting for round to end...
          </div>
        )}
      </div>
    </div>
  );
}
