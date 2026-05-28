/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { Map, MapMouseEvent, Marker, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { useGame } from '../context/GameContext';
import { Target, MapPin, Navigation, Eye, EyeOff, MessageSquare, Sparkles } from 'lucide-react';
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
  const { gameState, playerId, makeGuess, lastGuessResult, reactions, geminiMessages } = useGame();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const map = useMap();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Global handler for Google Maps auth failures
    // This catches ApiNotActivatedMapError, InvalidKeyMapError, etc.
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
  }, [geminiMessages]);

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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg max-w-md text-center border-l-4 border-red-500 dark:border-red-400">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-500/15 rounded-full">
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

  const currentPlayer = gameState?.players[playerId || ''];
  const canInteract = 
    (gameState?.status === 'seeking' && (!currentPlayer?.guesses || currentPlayer.guesses.length < 3));

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-900">
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

          {/* Show guesses for the current player (or all guesses if game is finished) */}
          {(Object.values(gameState?.players || {}) as Player[]).map(player => {
            if (player.id !== playerId && gameState?.status !== 'finished') return null; // Only show own guesses unless game over
            
            return (player.guesses || []).map((guess, idx) => (
              <AdvancedMarker key={`${player.id}-guess-${idx}`} position={guess}>
                <div className="relative group flex items-center justify-center">
                  {/* Pulse Effect */}
                  <div 
                    className="absolute w-12 h-12 rounded-full animate-ping"
                    style={{ backgroundColor: getPulseColor(guess.distance) }}
                  />
                  <Pin background={'#EF4444'} borderColor={'#7F1D1D'} glyphColor={'white'} scale={0.8} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="font-bold">{player.name}</div>
                    {Math.round(guess.distance)} km
                  </div>
                </div>
              </AdvancedMarker>
            ));
          })}

          {/* Show actual hider location ONLY if game is finished */}
          {gameState?.status === 'finished' && gameState.hiderLocation && (
            <AdvancedMarker position={gameState.hiderLocation}>
              <div className="animate-bounce">
                <Pin background={'#10B981'} borderColor={'#064E3B'} glyphColor={'white'} scale={1.2}>
                  <Target className="text-white w-4 h-4" />
                </Pin>
              </div>
            </AdvancedMarker>
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 flex items-center gap-2"
          >
            <Navigation className="w-5 h-5" />
            Confirm Guess
          </button>
        </div>
      )}

      {/* Last Guess Feedback Overlay */}
      {lastGuessResult && gameState?.status === 'seeking' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 z-10 animate-in fade-in slide-in-from-top-4">
          <CompassFeedback distance={lastGuessResult.distance} bearing={lastGuessResult.bearing} />
        </div>
      )}

      {/* Gemini Chat Overlay */}
      {geminiMessages.length > 0 && (
        <div className="absolute bottom-8 left-8 w-80 max-h-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-10 flex flex-col overflow-hidden pointer-events-auto">
          <div className="bg-blue-600 px-4 py-3 flex items-center gap-2 text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">Gemini AI</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {geminiMessages.map((msg, i) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl text-sm ${msg.type === 'hint' ? 'bg-amber-50 dark:bg-amber-500/15 border border-amber-100 dark:border-amber-400/20 text-amber-900 dark:text-amber-100' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'}`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">
                  {msg.type === 'hint' ? 'Hint' : 'Reasoning'}
                </div>
                {msg.text}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
