/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { Map, MapMouseEvent, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { useGame } from '../context/GameContext';
import { Target, MapPin, Navigation, EyeOff, MessageSquare, Sparkles } from 'lucide-react';
import { ZONES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import CompassFeedback from './CompassFeedback';
import { Player } from '../types';

function getPulseColor(distance: number) {
  if (distance < 50) return 'rgba(239, 68, 68, 0.6)'; // Red
  if (distance < 500) return 'rgba(249, 115, 22, 0.6)'; // Orange
  if (distance < 2000) return 'rgba(234, 179, 8, 0.6)'; // Yellow
  return 'rgba(59, 130, 246, 0.6)'; // Blue
}

export default function GameMap() {
  const { gameState, playerId, makeGuess, lastGuessResult, reactions, geminiMessages, askGemini, isAskingGemini } = useGame();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [mapError, setMapError] = useState<string | null>(null);
  const map = useMap();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Global handler for Google Maps auth failures
    (window as any).gm_authFailure = () => {
      setMapError("Google Maps rejected the API key. Please use a valid Google Maps browser key in VITE_GOOGLE_MAPS_API_KEY and make sure Maps JavaScript API is enabled for that key's project.");
    };

    return () => {
      (window as any).gm_authFailure = undefined;
    };
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [geminiMessages, isAskingGemini]);

  // Reset selected location when game state changes significantly
  useEffect(() => {
    if (gameState?.status === 'waiting') {
      setSelectedLocation(null);
    }
  }, [gameState?.status]);

  const currentZone = gameState?.zoneId ? ZONES[gameState.zoneId as keyof typeof ZONES] : ZONES.global;

  useEffect(() => {
    if (map && currentZone) {
      map.setCenter(currentZone.center);
      map.setZoom(currentZone.zoom);
    }
  }, [map, currentZone.id]);

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-950 p-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg max-w-md text-center border-l-4 border-red-500 dark:border-red-400">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-500/15 rounded-lg">
              <EyeOff className="w-8 h-8 text-red-600 dark:text-red-300" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Maps API Key Rejected</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {mapError}
          </p>
          <div className="text-left text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="font-semibold mb-2 text-slate-900 dark:text-white">How to fix:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
              <li>Create or select a Google Maps API key in the <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>.</li>
              <li>Set it in <strong>VITE_GOOGLE_MAPS_API_KEY</strong> in your .env file.</li>
              <li>Enable <strong>Maps JavaScript API</strong> for the same project.</li>
              <li>Check that browser referrer restrictions include localhost.</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-blue-500 transition"
          >
            I've Enabled It, Reload
          </button>
        </div>
      </div>
    );
  }

  const handleMapClick = (e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    
    const latLng = e.detail.latLng as any;
    const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
    const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
    
    const location = { lat, lng };
    setSelectedLocation(location);
  };

  const handleConfirmAction = () => {
    if (!selectedLocation) return;

    if (gameState?.status === 'seeking') {
      if (gameState.hiderId !== playerId) {
        makeGuess(selectedLocation);
        setSelectedLocation(null);
      }
    }
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    askGemini(questionText.trim());
    setQuestionText('');
  };

  const currentPlayer = gameState?.players[playerId || ''];
  const canInteract = 
    (gameState?.status === 'seeking' && (!currentPlayer?.guesses || currentPlayer.guesses.length < 3));

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-900">
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={currentZone.center}
          defaultZoom={currentZone.zoom}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          onClick={canInteract ? handleMapClick : undefined}
          mapId="DEMO_MAP_ID" // Required for AdvancedMarker
          restriction={currentZone.bounds ? { latLngBounds: currentZone.bounds, strictBounds: false } : undefined}
        >
          {/* Show selected location pending confirmation */}
          {selectedLocation && (
            <AdvancedMarker position={selectedLocation}>
              <Pin background={'#4F46E5'} borderColor={'#312E81'} glyphColor={'white'} />
            </AdvancedMarker>
          )}

          {/* Regular Gameplay Mode: Show guesses for the current player (or all guesses if game is finished) */}
          {gameState?.status !== 'match_complete' && (Object.values(gameState?.players || {}) as Player[]).map(player => {
            if (player.id !== playerId && gameState?.status !== 'finished') return null; // Only show own guesses unless game over
            
            return (player.guesses || []).map((guess, idx) => (
              <AdvancedMarker key={`${player.id}-guess-${idx}`} position={guess}>
                <div className="relative group flex items-center justify-center">
                  <div 
                    className="absolute w-12 h-12 rounded-full animate-ping"
                    style={{ backgroundColor: getPulseColor(guess.distance) }}
                  />
                  <Pin background={'#EF4444'} borderColor={'#7F1D1D'} glyphColor={'white'} scale={0.8} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="font-bold">{player.name}</div>
                    <div>{Math.round(guess.distance)} km away</div>
                    <div className="text-yellow-400 font-bold">{guess.points} pts</div>
                  </div>
                </div>
              </AdvancedMarker>
            ));
          })}

          {/* Regular Gameplay Mode: Show actual hider location ONLY if round is finished */}
          {gameState?.status === 'finished' && gameState.hiderLocation && (
            <AdvancedMarker position={gameState.hiderLocation}>
              <div className="animate-bounce flex flex-col items-center">
                <Pin background={'#10B981'} borderColor={'#064E3B'} glyphColor={'white'} scale={1.2}>
                  <Target className="text-white w-4 h-4" />
                </Pin>
                <div className="bg-emerald-900 text-white text-xs font-extrabold px-2 py-1 rounded shadow-md mt-1 whitespace-nowrap z-20">
                  {gameState.hiderLocation.name}
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Match Complete Mode: Show all targets and all guesses from match history */}
          {gameState?.status === 'match_complete' && gameState.roundHistory && (
            <>
              {gameState.roundHistory.map((round, rIdx) => (
                <React.Fragment key={`history-round-${rIdx}`}>
                  {/* Round Target Landmark */}
                  <AdvancedMarker position={round.targetLocation}>
                    <div className="flex flex-col items-center z-10">
                      <Pin background={'#10B981'} borderColor={'#064E3B'} glyphColor={'white'} scale={1.1}>
                        <Target className="text-white w-4 h-4" />
                      </Pin>
                      <div className="bg-emerald-950 text-white text-[10px] px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap font-bold border border-emerald-500/30">
                        R{round.roundNumber}: {round.targetName.split(',')[0]}
                      </div>
                    </div>
                  </AdvancedMarker>

                  {/* Round's Guesses */}
                  {round.guesses.map((guess, gIdx) => (
                    <AdvancedMarker key={`history-guess-${rIdx}-${gIdx}`} position={guess}>
                      <div className="relative group flex flex-col items-center">
                        <Pin background={'#4F46E5'} borderColor={'#312E81'} glyphColor={'white'} scale={0.7} />
                        <div className="bg-indigo-950 text-indigo-200 text-[9px] px-1.5 py-0.5 rounded shadow mt-0.5 whitespace-nowrap font-bold font-mono border border-indigo-500/30">
                          R{round.roundNumber} G{gIdx + 1} ({round.bestPoints} pts)
                        </div>
                      </div>
                    </AdvancedMarker>
                  ))}
                </React.Fragment>
              ))}
            </>
          )}
        </Map>

      {/* Floating Emojis Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {reactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ opacity: 1, y: '100vh', x: `${reaction.x}vw`, scale: 0.5 }}
              animate={{ opacity: 0, y: '-20vh', scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: 'easeOut' }}
              className="absolute text-6xl drop-shadow-lg"
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Action Overlay */}
      {selectedLocation && canInteract && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={handleConfirmAction}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-7 rounded-lg shadow-lg transform transition hover:scale-105 flex items-center gap-2"
          >
            <Navigation className="w-5 h-5" />
            Confirm Guess
          </button>
        </div>
      )}

      {/* Last Guess Feedback Overlay */}
      {lastGuessResult && gameState?.status === 'seeking' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10 animate-in fade-in slide-in-from-top-4">
          <CompassFeedback distance={lastGuessResult.distance} bearing={lastGuessResult.bearing} />
        </div>
      )}

      {/* Gemini Chat Overlay & Ask Question Input */}
      {geminiMessages.length > 0 && gameState?.status !== 'match_complete' && (
        <div className="absolute bottom-6 left-6 w-80 h-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-10 flex flex-col overflow-hidden pointer-events-auto transition-all">
          <div className="bg-blue-600 px-4 py-3 flex items-center gap-2 text-white shadow-sm flex-shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="font-semibold text-sm">Gemini AI</span>
          </div>
          
          {/* Chat Bubble Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {geminiMessages.map((msg, i) => {
              let bubbleClass = '';
              let title = '';
              
              if (msg.type === 'hint') {
                bubbleClass = 'bg-amber-50 dark:bg-amber-500/15 border border-amber-100 dark:border-amber-400/20 text-amber-900 dark:text-amber-100';
                title = 'Hint';
              } else if (msg.type === 'reasoning') {
                bubbleClass = 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100';
                title = 'Reasoning';
              } else if (msg.type === 'question') {
                bubbleClass = 'bg-blue-500 text-white border border-blue-600 rounded-br-none ml-8 shadow-sm';
                title = `${currentPlayer?.name || 'You'}`;
              } else if (msg.type === 'answer') {
                bubbleClass = 'bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-100 dark:border-indigo-400/20 text-indigo-900 dark:text-indigo-100 rounded-bl-none mr-8';
                title = 'Gemini Answer';
              }

              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl text-xs ${bubbleClass}`}
                >
                  <div className={`text-[9px] font-black uppercase tracking-wider mb-1 opacity-60 ${msg.type === 'question' ? 'text-blue-100' : ''}`}>
                    {title}
                  </div>
                  <p className="leading-relaxed whitespace-pre-line font-medium">{msg.text}</p>
                </motion.div>
              );
            })}
            
            {isAskingGemini && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-xl text-xs bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-100 dark:border-indigo-400/20 text-indigo-900 dark:text-indigo-100 mr-8 flex items-center gap-2"
              >
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Gemini is typing...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Custom Question Input */}
          {gameState?.status === 'seeking' && (
            <form onSubmit={handleAskQuestion} className="p-2 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-slate-50 dark:bg-slate-900/40 flex-shrink-0">
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                disabled={isAskingGemini}
                placeholder="Ask Gemini a question... (-250 pts)"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 font-semibold"
              />
              <button
                type="submit"
                disabled={isAskingGemini || !questionText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center"
              >
                {isAskingGemini ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
