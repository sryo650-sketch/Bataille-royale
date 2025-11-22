import { Timestamp } from 'firebase/firestore';

export type GameMode = 'classic' | 'rapid' | 'daily';

export type GamePhaseServer = 
  | 'WAITING' 
  | 'LOCKED' 
  | 'REVEALING' 
  | 'RESOLVING' 
  | 'BATTLE' 
  | 'GAME_OVER';

export type GameStatus = 'waiting' | 'in_progress' | 'finished';

export type DefeatReason = 'normal' | 'inactivity' | 'surrender';

export type SpecialType = 'attack' | 'defense';

export interface PlayerState {
  uid: string;
  name: string;
  countryCode: string;
  avatar?: string;
  
  // Deck (IDs des cartes uniquement)
  deck: string[]; // ['2H', '3D', 'AS', ...]
  currentCardIndex: number | null;
  
  // Score et charges
  score: number;
  specialCharges: number;
  
  // État du round
  isLocked: boolean;
  usingSpecial: SpecialType | null;
  
  // Momentum (règle spéciale)
  hasMomentum?: boolean; // Si true, le prochain bonus est gratuit
  hasCooldown?: boolean; // Si true, impossible d'utiliser un bonus ce round (après Momentum)
}

export interface GameState {
  id: string;
  mode: GameMode;
  status: GameStatus;
  
  // Joueurs
  player1: PlayerState;
  player2: PlayerState;
  
  // Événement Kraken
  krakenEvent?: {
    p1Card: string | null;
    p2Card: string | null;
  } | null;
  
  // État de la partie
  phase: GamePhaseServer;
  pot: string[]; // IDs des cartes dans le pot
  roundCount: number;
  
  // Timer (mode Rapid uniquement)
  startedAt: Timestamp;
  rapidTimeLeft: number | null; // Secondes restantes
  lastTimerUpdate: Timestamp;
  lastActionAt?: Timestamp; // Dernière action (pour détecter l'inactivité)
  
  // Résultat
  winner: string | null; // UID du gagnant
  defeatReason: DefeatReason | null;
  
  // Métadonnées
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GameAction {
  gameId: string;
  playerId: string;
  type: 'LOCK_CARD' | 'USE_SPECIAL_ATTACK' | 'USE_SPECIAL_DEFENSE' | 'SURRENDER';
  timestamp: Timestamp;
  validated: boolean;
  error?: string;
}

// Données pour créer une partie
export interface CreateGameData {
  mode: GameMode;
  opponentId?: string; // Si null, jouer contre un bot
}

// Données pour une action
export interface GameActionData {
  gameId: string;
}

export interface UseSpecialData extends GameActionData {
  specialType: SpecialType;
}
