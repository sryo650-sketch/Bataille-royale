import { Rank, Suit } from './types';

export const DECK_SIZE = 52;

export const SUIT_COLORS: Record<Suit, string> = {
  [Suit.HEARTS]: '#EF4444',   // Rouge pour Cœur
  [Suit.DIAMONDS]: '#EF4444', // Rouge pour Carreau
  [Suit.CLUBS]: '#111827',    // Noir pour Trèfle
  [Suit.SPADES]: '#111827',   // Noir pour Pique
};

export const RANK_LABELS: Record<Rank, string> = {
  [Rank.TWO]: '2',
  [Rank.THREE]: '3',
  [Rank.FOUR]: '4',
  [Rank.FIVE]: '5',
  [Rank.SIX]: '6',
  [Rank.SEVEN]: '7',
  [Rank.EIGHT]: '8',
  [Rank.NINE]: '9',
  [Rank.TEN]: '10',
  [Rank.JACK]: 'J',
  [Rank.QUEEN]: 'Q',
  [Rank.KING]: 'K',
  [Rank.ACE]: 'A',
};

// ❌ MOCK DATA REMOVED - Using Firebase now
// MOCK_FRIENDS and MOCK_RANDOM_PLAYERS have been replaced by Firebase hooks:
// - useFriendsFirebase()
// - useRandomPlayersFirebase()

export type FriendStatus = 'In Game' | 'Online' | 'Offline';

export interface LeaderboardEntry {
  id: string;
  name: string;
  elo: number;
  countryCode: string;
  trend: 'up' | 'down' | 'steady';
}

export const GLOBAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'g1', name: 'NovaPrime', elo: 2140, countryCode: 'US', trend: 'up' },
  { id: 'g2', name: 'Sakura', elo: 2095, countryCode: 'JP', trend: 'steady' },
  { id: 'g3', name: 'LeMatador', elo: 2052, countryCode: 'FR', trend: 'down' },
  { id: 'g4', name: 'Aria', elo: 2011, countryCode: 'GB', trend: 'up' },
  { id: 'g5', name: 'Cobra', elo: 1988, countryCode: 'BR', trend: 'steady' },
];

export const COUNTRY_LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  FR: [
    { id: 'fr1', name: 'LeMatador', elo: 2052, countryCode: 'FR', trend: 'down' },
    { id: 'fr2', name: 'ClaraB', elo: 1984, countryCode: 'FR', trend: 'up' },
    { id: 'fr3', name: 'Mistral', elo: 1920, countryCode: 'FR', trend: 'steady' },
    { id: 'fr4', name: 'DarkAce', elo: 1888, countryCode: 'FR', trend: 'up' },
    { id: 'fr5', name: 'Fennec', elo: 1830, countryCode: 'FR', trend: 'steady' },
  ],
  US: [
    { id: 'us1', name: 'NovaPrime', elo: 2140, countryCode: 'US', trend: 'up' },
    { id: 'us2', name: 'NightOwl', elo: 1995, countryCode: 'US', trend: 'steady' },
    { id: 'us3', name: 'Atlas', elo: 1932, countryCode: 'US', trend: 'up' },
    { id: 'us4', name: 'Rook', elo: 1870, countryCode: 'US', trend: 'down' },
    { id: 'us5', name: 'Valk', elo: 1824, countryCode: 'US', trend: 'steady' },
  ],
};

// UI Constants - Centralized magic numbers and default values
export const UI_CONSTANTS = {
  BORDER_RADIUS_FULL: 999,
  BORDER_RADIUS_CARD: 20,
  BORDER_RADIUS_MEDIUM: 16,
  SPACING_LARGE: 48,
  SPACING_MEDIUM: 24,
  SPACING_SMALL: 12,
  SPACING_TINY: 8,
  DEFAULT_COUNTRY: 'FR',
  MAX_CHARGES: 3,
  ALLOWED_AVATAR_DOMAINS: ['picsum.photos', 'avatars.githubusercontent.com', 'cdn.example.com'],
} as const;
