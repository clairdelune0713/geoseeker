/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, MapPin, RefreshCw, Eye, Target, Compass, Globe, Moon, Sun, Award, CheckCircle2, XCircle, Sparkles, ArrowRight, Star } from 'lucide-react';
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
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    setCustomName(generateName());
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await joinGame(customName);
    if (success) {
      setHasJoined(true);
    }
  };

  const currentPlayer = gameState?.players[playerId || ''];
  const hiderName = gameState?.hiderId ? gameState.players[gameState.hiderId]?.name : 'Unknown';
  const currentZone = gameState?.zoneId ? ZONES[gameState.zoneId as keyof typeof ZONES] : ZONES.global;
  const guessCount = currentPlayer?.guesses?.length || 0;
  
  // Calculate total score and round status
  const totalScore = currentPlayer?.score || 0;
  const showStreetView = gameState?.hiderLocation && (gameState.status === 'seeking' || gameState.status === 'finished');

  // Rank / Grade based on total score
  const getRank = (score: number) => {
    if (score >= 22500) return { title: 'Geographical Deity 👑', color: 'text-amber-500' };
    if (score >= 18000) return { title: 'Master Cartographer 🗺️', color: 'text-purple-500' };
    if (score >= 12000) return { title: 'Expert Explorer 🧭', color: 'text-blue-500' };
    if (score >= 5000) return { title: 'Curious Seeker 🎒', color: 'text-emerald-500' };
    return { title: 'Lost Wanderer 🌲', color: 'text-slate-400' };
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center gap-2 font-display">
              <span className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/25">
                <MapPin className="w-5 h-5" />
              </span>
              GeoDawg
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wide">
              {gameState?.status === 'match_complete' ? 'Match Summary' : `Round ${gameState?.round || 1} / ${gameState?.maxRounds || 5}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
            className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {gameState && gameState.status !== 'waiting' && gameState.status !== 'match_complete' && (
        <div className={`px-5 py-4 text-white shadow-inner transition-colors duration-500
          ${gameState?.status === 'hiding' ? 'bg-amber-500' : ''}
          ${gameState?.status === 'seeking' ? 'bg-blue-600' : ''}
          ${gameState?.status === 'finished' ? (gameState.lastRoundWon ? 'bg-emerald-600' : 'bg-rose-600') : ''}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {gameState?.status === 'hiding' && (
                <>
                  <Eye className="w-6 h-6 text-white animate-pulse" strokeWidth={1.5} />
                  <div className="leading-tight text-base font-bold">
                    {hiderName} is hiding...
                  </div>
                </>
              )}
              {gameState?.status === 'seeking' && (
                <>
                  <Target className="w-6 h-6 text-white" strokeWidth={1.5} />
                  <div className="leading-tight text-base font-bold">
                    Seekers are searching!
                  </div>
                </>
              )}
              {gameState?.status === 'finished' && (
                <>
                  {gameState.lastRoundWon ? (
                    <Trophy className="w-6 h-6 text-white animate-bounce" strokeWidth={1.5} />
                  ) : (
                    <XCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
                  )}
                  <div className="leading-tight text-base font-bold">
                    {gameState.lastRoundWon ? 'You Found It!' : 'Out of Guesses!'}
                  </div>
                </>
              )}
            </div>
            {gameState?.zoneId && (
              <div className="flex items-center gap-2 text-xs bg-slate-800/30 px-3 py-2 rounded-lg">
                <Globe className="w-4 h-4 text-white" strokeWidth={1.5} />
                <div className="leading-tight font-bold max-w-28 truncate">
                  {(() => {
                    const name = ZONES[gameState.zoneId as keyof typeof ZONES]?.name || 'Global';
                    const parts = name.split(' (');
                    return parts[0];
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState?.status !== 'match_complete' && (
        <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Zone</p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{currentZone.name}</p>
          </div>
          <div className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Guesses</p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{guessCount}/3</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Score</p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{totalScore.toLocaleString()} pts</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 dark:bg-slate-950">

        {/* 1. JOIN GAME */}
        {!hasJoined && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleJoin}
            className="bg-white dark:bg-slate-900 p-5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white font-display text-xl">Play vs Gemini AI</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join as the seeker and find the AI's secret spot!</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="playerName" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Your Seeker Name
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold transition"
                  placeholder="Enter your custom name..."
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-lg transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" />
                Join as Seeker
              </button>
            </div>
          </motion.form>
        )}

        {/* 2. PLAYER ROLE INFO (SEEKING STATE) */}
        {hasJoined && gameState?.status !== 'match_complete' && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Your Profile</p>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-lg truncate">{currentPlayer?.name || customName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  Rank: <span className="font-semibold">{getRank(totalScore).title}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. ROUND FINISHED STATE DETAILS */}
        {gameState?.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <Award className="w-4 h-4 text-blue-500" />
                Round {gameState.round} Result
              </div>
              
              <div>
                <p className="text-xs text-slate-400">Gemini's Hiding Spot:</p>
                <p className="text-lg font-black text-slate-900 dark:text-white leading-snug mt-1 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">📍</span>
                  {gameState.hiderLocation?.name || 'Secret Location'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Guess History</p>
                {currentPlayer?.guesses && currentPlayer.guesses.length > 0 ? (
                  <div className="space-y-2">
                    {currentPlayer.guesses.map((guess, idx) => {
                      const isWinningGuess = guess.distance <= currentZone.winThresholdKm;
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-colors ${
                            isWinningGuess 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' 
                              : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span>{Math.round(guess.distance).toLocaleString()} km away</span>
                          </div>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            +{guess.points} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No guesses made this round.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. MATCH COMPLETED Recaps */}
        {gameState?.status === 'match_complete' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Main Score Tally Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/30 text-center shadow-xl relative overflow-hidden text-white">
              <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
              
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-bounce" />
              
              <h2 className="text-2xl font-black tracking-tight uppercase font-display">Match Completed!</h2>
              <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider mt-1">Final Scoreboard</p>
              
              <div className="mt-6 flex flex-col items-center">
                <p className="text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-300">
                  {totalScore.toLocaleString()}
                </p>
                <p className="text-sm text-indigo-300 font-semibold mt-1">out of 25,000 points</p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-indigo-200 uppercase tracking-widest font-bold">Your Rank</p>
                <p className={`text-lg font-extrabold mt-1 ${getRank(totalScore).color}`}>
                  {getRank(totalScore).title}
                </p>
              </div>
            </div>

            {/* Scrollable list of the 5 rounds */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Match Journey</p>
              
              {gameState.roundHistory && gameState.roundHistory.map((round, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex items-start gap-3 relative">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    round.won 
                      ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}>
                    {round.won ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Round {round.roundNumber}</p>
                    <p className="font-extrabold text-slate-900 dark:text-white mt-1 leading-snug truncate">
                      {round.targetName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Best: <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.round(round.bestDistance).toLocaleString()} km</span> away ({round.guesses.length} guesses)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-base block">
                      {round.bestPoints}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 5. ZONE CHOOSER & START GAME */}
        {hasJoined && gameState?.status === 'waiting' && Object.keys(gameState?.players || {}).length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                Select Game Zone
              </label>
              <select
                value={gameState.zoneId || 'global'}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-100"
              >
                {Object.values(ZONES).map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-zinc-900/20 dark:shadow-blue-950/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
            >
              <Target className="w-6 h-6" />
              Start Round
            </button>
          </motion.div>
        )}

        {/* 6. STREET VIEW PREVIEW */}
        {showStreetView && gameState.hiderLocation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
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

      {/* FOOTER BUTTONS & CONTROLS */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {gameState?.status === 'finished' && (
          <button
            onClick={resetGame}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition shadow-md"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            {gameState.round >= gameState.maxRounds ? 'See Final Results' : 'Next Round'}
          </button>
        )}
        
        {gameState?.status === 'match_complete' && (
          <button
            onClick={resetGame}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-lg transition shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            Play New Match
          </button>
        )}

        {gameState?.status !== 'finished' && gameState?.status !== 'match_complete' && (
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            GeoSeeker Ready
          </div>
        )}
      </div>
    </div>
  );
}
