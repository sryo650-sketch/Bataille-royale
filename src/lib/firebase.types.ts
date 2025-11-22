// src/lib/firebase.types.ts
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  countryCode: string;
  elo: number;
  currentStreak: number;
  bestStreak: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  availableCharges: number;
  lastChargeRefill: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeen: Timestamp;
  status: 'online' | 'offline' | 'in_game';
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1CountryCode: string;
  player2CountryCode: string;
  player1Avatar?: string;
  player2Avatar?: string;
  mode: 'classic' | 'rapid';
  result: 'WIN' | 'LOSS' | 'DRAW';
  rounds: Array<{
    roundNumber: number;
    player1Card: string;
    player2Card: string;
    winner: 'player1' | 'player2' | 'draw';
  }>;
  finalScore: {
    player1: number;
    player2: number;
  };
  player1EloChange: number;
  player2EloChange: number;
  duration: number;
  createdAt: Timestamp;
  completedAt: Timestamp;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  friendName: string;
  friendAvatar?: string;
  friendCountryCode: string;
  friendElo: number;
  friendStatus: 'online' | 'offline' | 'in_game';
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
}

export interface Challenge {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  mode: 'classic' | 'rapid';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  respondedAt?: Timestamp;
  matchId?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  participantAvatars: (string | null)[];
  lastMessage: string;
  lastMessageAt: Timestamp;
  lastMessageBy: string;
  unreadCount: Record<string, number>;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  readBy: string[];
}

export interface UserStats {
  period: 'daily' | 'weekly' | 'monthly' | 'allTime';
  wins: number;
  losses: number;
  draws: number;
  eloGained: number;
  eloLost: number;
  gamesPlayed: number;
  averageGameDuration: number;
  longestStreak: number;
  winRate: number;
  updatedAt: Timestamp;
}
