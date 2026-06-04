/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Guess {
  lat: number;
  lng: number;
  distance: number;
  points: number; // GeoGuessr points out of 5000
}

export interface Player {
  id: string;
  name: string;
  role: 'hider' | 'seeker' | 'spectator';
  guesses: Guess[];
  score: number; // cumulative points across all rounds
}

export interface RoundResult {
  roundNumber: number;
  targetName: string;
  targetLocation: { lat: number; lng: number };
  guesses: Guess[];
  won: boolean;
  bestDistance: number;
  bestPoints: number;
}

export interface QuestionAsked {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  status: 'waiting' | 'hiding' | 'seeking' | 'finished' | 'match_complete';
  hiderId: string | null;
  hiderLocation: { lat: number; lng: number; name: string } | null;
  players: Record<string, Player>;
  round: number;
  maxRounds: number; // e.g. 5
  zoneId: string;
  roundHistory: RoundResult[];
  lastRoundWon: boolean | null;
  questionsAsked: QuestionAsked[];
}

export interface Reaction {
  id: string;
  emoji: string;
  timestamp: number;
  x: number;
}
