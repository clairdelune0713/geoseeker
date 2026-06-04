/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { GameState, Reaction, Player, RoundResult, QuestionAsked } from '../types';
import { geminiHide, geminiProvideHint, geminiAnswerQuestion } from '../services/geminiService';
import { ZONES } from '../constants';

export interface GeminiMessage {
  id: string;
  text: string;
  type: 'hint' | 'reasoning' | 'question' | 'answer';
}

interface GameContextType {
  gameState: GameState | null;
  isConnected: boolean;
  playerId: string | null;
  joinGame: (name: string) => Promise<boolean>;
  startGame: () => void;
  setZone: (zoneId: string) => void;
  sendReaction: (emoji: string) => void;
  makeGuess: (location: { lat: number; lng: number }) => void;
  resetGame: () => void;
  lastGuessResult: { distance: number; location: { lat: number; lng: number }; bearing: number; points: number } | null;
  reactions: Reaction[];
  geminiMessages: GeminiMessage[];
  askGemini: (question: string) => Promise<void>;
  isAskingGemini: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Helper: Calculate Distance (Haversine)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// Helper: Calculate Bearing
function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = deg2rad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(deg2rad(lat2));
  const x = Math.cos(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) -
            Math.sin(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.cos(dLon);
  const brng = Math.atan2(y, x);
  return (brng * 180 / Math.PI + 360) % 360;
}

// Helper: Calculate GeoGuessr Points
function calculatePoints(distance: number, decayScale: number): number {
  if (distance < 0.05) return 5000; // Perfect within 50m
  const score = Math.round(5000 * Math.exp(-distance / decayScale));
  return Math.max(0, Math.min(5000, score));
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastGuessResult, setLastGuessResult] = useState<{ distance: number; location: { lat: number; lng: number }; bearing: number; points: number } | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [geminiMessages, setGeminiMessages] = useState<GeminiMessage[]>([]);
  const [isAskingGemini, setIsAskingGemini] = useState(false);

  useEffect(() => {
    let storedId = sessionStorage.getItem('geoseeker_player_id');
    if (!storedId) {
      storedId = 'player_' + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('geoseeker_player_id', storedId);
    }
    setPlayerId(storedId);
    setIsConnected(true);
  }, []);

  const joinGame = async (name: string): Promise<boolean> => {
    if (!playerId) return false;

    const geminiId = 'gemini_ai';
    const newPlayer: Player = {
      id: playerId,
      name: name || `Player ${playerId.substr(0, 4)}`,
      role: 'seeker',
      guesses: [],
      score: 0, // start with 0 points
    };

    const geminiPlayer: Player = {
      id: geminiId,
      name: 'Gemini AI',
      role: 'hider',
      guesses: [],
      score: 0,
    };

    setGameState({
      roomId: 'local_game',
      status: 'waiting',
      hiderId: geminiId,
      hiderLocation: null,
      players: {
        [playerId]: newPlayer,
        [geminiId]: geminiPlayer
      },
      round: 1,
      maxRounds: 5,
      zoneId: 'global',
      roundHistory: [],
      lastRoundWon: null,
      questionsAsked: []
    });
    
    setGeminiMessages([]);

    return true;
  };

  const startGame = async () => {
    if (!gameState) return;
    if (gameState.status !== 'waiting') return;

    setGameState(prev => prev ? { ...prev, status: 'hiding' } : null);

    // Gemini hides
    const result = await geminiHide(gameState.zoneId);
    setGameState(prev => prev ? {
      ...prev,
      hiderLocation: { lat: result.lat, lng: result.lng, name: result.name },
      status: 'seeking'
    } : null);
    setGeminiMessages([{ id: Date.now().toString(), text: result.message, type: 'hint' }]);
  };

  const setZone = async (zoneId: string) => {
    if (!gameState) return;
    if (gameState.status !== 'waiting') return;
    
    setGameState(prev => prev ? { ...prev, zoneId } : null);
  };

  const sendReaction = async (emoji: string) => {
    const reaction: Reaction = {
      id: Math.random().toString(36).substr(2, 9),
      emoji,
      timestamp: Date.now(),
      x: Math.random() * 80 + 10
    };

    setReactions(prev => [...prev, reaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  };

  const makeGuess = async (location: { lat: number; lng: number }) => {
    if (!gameState || !playerId) return;
    if (gameState.status !== 'seeking') return;
    if (gameState.players[playerId]?.role === 'hider') return;
    if (!gameState.hiderLocation) return;

    const player = gameState.players[playerId];
    if (!player) return;
    
    if ((player.guesses || []).length >= 3) return;

    const distance = getDistanceFromLatLonInKm(
      location.lat,
      location.lng,
      gameState.hiderLocation.lat,
      gameState.hiderLocation.lng
    );

    const bearing = getBearing(
      location.lat,
      location.lng,
      gameState.hiderLocation.lat,
      gameState.hiderLocation.lng
    );

    const zone = ZONES[gameState.zoneId as keyof typeof ZONES] || ZONES.global;
    const winThreshold = zone.winThresholdKm;
    const decayScale = zone.decayScale;

    const points = calculatePoints(distance, decayScale);
    const newGuess = { ...location, distance, points };
    const newGuesses = [...(player.guesses || []), newGuess];

    const isWin = distance <= winThreshold;
    const isRoundOver = isWin || newGuesses.length >= 3;

    const bestRoundPoints = Math.max(...newGuesses.map(g => g.points));

    setGameState(prev => {
      if (!prev) return null;
      
      let newStatus = prev.status;
      let newRoundHistory = [...prev.roundHistory];
      let newPlayers = { ...prev.players };
      let lastRoundWon = prev.lastRoundWon;

      if (isRoundOver) {
        newStatus = 'finished';
        lastRoundWon = isWin;
        
        const roundResult: RoundResult = {
          roundNumber: prev.round,
          targetName: prev.hiderLocation?.name || 'Unknown Landmark',
          targetLocation: { lat: prev.hiderLocation!.lat, lng: prev.hiderLocation!.lng },
          guesses: newGuesses,
          won: isWin,
          bestDistance: Math.min(...newGuesses.map(g => g.distance)),
          bestPoints: bestRoundPoints
        };
        newRoundHistory.push(roundResult);
        
        newPlayers[playerId] = {
          ...player,
          guesses: newGuesses,
          score: player.score + bestRoundPoints
        };
      } else {
        newPlayers[playerId] = {
          ...player,
          guesses: newGuesses
        };
      }
      
      return {
        ...prev,
        status: newStatus,
        players: newPlayers,
        roundHistory: newRoundHistory,
        lastRoundWon
      };
    });

    setLastGuessResult({ distance, location, bearing, points });
    
    // Provide hint if game is not finished
    if (!isWin && newGuesses.length < 3) {
      const hint = await geminiProvideHint(gameState.zoneId, gameState.hiderLocation, newGuesses);
      setGeminiMessages(prev => [...prev, { id: Date.now().toString(), text: hint, type: 'hint' }]);
    }
  };

  const askGemini = async (question: string) => {
    if (!gameState || !playerId || gameState.status !== 'seeking') return;
    if (!gameState.hiderLocation) return;

    const player = gameState.players[playerId];
    if (!player) return;

    // Deduct 250 points, but make sure they don't go below 0
    const cost = 250;
    const newScore = Math.max(0, player.score - cost);

    const questionId = 'q_' + Date.now();
    setGeminiMessages(prev => [...prev, { id: questionId, text: question, type: 'question' }]);
    setIsAskingGemini(true);

    try {
      const prevQuestions = gameState.questionsAsked.map(q => ({ question: q.question, answer: q.answer }));
      const answer = await geminiAnswerQuestion(gameState.zoneId, gameState.hiderLocation, question, prevQuestions);

      const answerId = 'a_' + Date.now();
      setGeminiMessages(prev => [...prev, { id: answerId, text: answer, type: 'answer' }]);

      const newQuestion: QuestionAsked = {
        id: questionId,
        question,
        answer,
        timestamp: Date.now()
      };

      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: {
            ...prev.players,
            [playerId]: {
              ...player,
              score: newScore
            }
          },
          questionsAsked: [...prev.questionsAsked, newQuestion]
        };
      });
    } catch (error) {
      console.error("Error asking Gemini:", error);
    } finally {
      setIsAskingGemini(false);
    }
  };

  const resetGame = async () => {
    if (!gameState) return;

    if (gameState.status === 'match_complete') {
      // PLAY AGAIN
      const playerIds = Object.keys(gameState.players);
      const nextHiderId = 'gemini_ai';
      
      setGameState(prev => {
        if (!prev) return null;
        
        const newPlayers = { ...prev.players };
        playerIds.forEach(id => {
          newPlayers[id] = {
            ...newPlayers[id],
            role: id === nextHiderId ? 'hider' : 'seeker',
            guesses: [],
            score: 0
          };
        });

        return {
          ...prev,
          status: 'waiting',
          hiderLocation: null,
          round: 1,
          maxRounds: 5,
          hiderId: nextHiderId,
          players: newPlayers,
          roundHistory: [],
          lastRoundWon: null,
          questionsAsked: []
        };
      });
      setLastGuessResult(null);
      setGeminiMessages([]);
      return;
    }

    if (gameState.round >= gameState.maxRounds) {
      setGameState(prev => prev ? { ...prev, status: 'match_complete' } : null);
      return;
    }

    const playerIds = Object.keys(gameState.players);
    const nextHiderId = 'gemini_ai'; // Gemini is always the hider

    setGameState(prev => {
      if (!prev) return null;
      
      const newPlayers = { ...prev.players };
      playerIds.forEach(id => {
        newPlayers[id] = {
          ...newPlayers[id],
          role: id === nextHiderId ? 'hider' : 'seeker',
          guesses: [],
          // score is accumulated, so keep it!
        };
      });

      return {
        ...prev,
        status: 'waiting',
        hiderLocation: null,
        round: prev.round + 1,
        hiderId: nextHiderId,
        players: newPlayers,
        questionsAsked: []
      };
    });
    
    setLastGuessResult(null);
    setGeminiMessages([]);
  };

  return (
    <GameContext.Provider value={{ 
      gameState, 
      isConnected, 
      playerId,
      joinGame,
      startGame,
      setZone,
      sendReaction,
      makeGuess,
      resetGame,
      lastGuessResult,
      reactions,
      geminiMessages,
      askGemini,
      isAskingGemini
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
