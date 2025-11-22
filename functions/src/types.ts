import { Timestamp } from 'firebase-admin/firestore';

export type GameMode = 'classic' | 'rapid' | 'daily';
export type GameStatus = 'waiting' | 'in_progress' | 'finished';
export type DefeatReason = 'normal' | 'inactivity' | 'surrender';
export type SpecialType = 'attack' | 'defense';
export type GamePhase = 'WAITING' | 'LOCKED' | 'REVEALING' | 'RESOLVING' | 'BATTLE' | 'GAME_OVER';

export interface PlayerState {
  uid: string;
  name: string;
  countryCode: string;
  avatar?: string;
  deck: string[];
  currentCardIndex: number | null;
  score: number;
  specialCharges: number;
  isLocked: boolean;
  usingSpecial: SpecialType | null;
  timeoutCount: number; // Nombre de fois où le joueur n'a pas lock à temps
  hasMomentum: boolean; // Si true, le prochain bonus est gratuit
  hasCooldown: boolean; // Si true, impossible d'utiliser un bonus ce round (après Momentum)
  maxPV: number; // PV max décroissant (52 au départ, réduit par le Kraken)
  krakensCount: number; // Nombre de cartes retirées par le Kraken
}

export interface GameState {
  id?: string;
  mode: GameMode;
  status: GameStatus;
  player1: PlayerState;
  player2: PlayerState;
  phase: GamePhase;
  pot: string[];
  roundCount: number;
  startedAt: Timestamp;
  rapidTimeLeft: number | null;
  lastTimerUpdate: Timestamp;
  lastActionAt: Timestamp; // Dernière action d'un joueur (pour détecter l'inactivité)
  winner: string | null;
  defeatReason: DefeatReason | null;
  krakenEvent?: {
    p1Card: string | null;
    p2Card: string | null;
  } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateGameData {
  mode: GameMode;
  opponentId?: string;
}

export interface GameActionData {
  gameId: string;
}

export interface UseSpecialData extends GameActionData {
  specialType: SpecialType;
}

export enum Suit {
  HEARTS = '♥',
  DIAMONDS = '♦',
  CLUBS = '♣',
  SPADES = '♠'
}

export enum Rank {
  TWO = 2, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN, JACK, QUEEN, KING, ACE
}

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
}
