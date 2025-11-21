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

export const MOCK_FRIENDS = [
  { id: '1', name: 'Sarah K.', status: 'In Game', avatar: 'https://picsum.photos/50/50?random=1', countryCode: 'FR' },
  { id: '2', name: 'Mike D.', status: 'Online', avatar: 'https://picsum.photos/50/50?random=2', countryCode: 'CA' },
  { id: '3', name: 'Alex R.', status: 'Offline', avatar: 'https://picsum.photos/50/50?random=3', countryCode: 'US' },
] as const;

export type FriendStatus = (typeof MOCK_FRIENDS)[number]['status'];

export const MOCK_RANDOM_PLAYERS = [
  {
    id: 'r1',
    name: 'Nova',
    mode: 'Turbo',
    timeAgo: '2m',
    elo: 1480,
    avatar: 'https://picsum.photos/50/50?random=11',
    countryCode: 'US',
  },
  {
    id: 'r2',
    name: 'ShadowFox',
    mode: 'Ranked',
    timeAgo: '5m',
    elo: 1525,
    avatar: 'https://picsum.photos/50/50?random=12',
    countryCode: 'JP',
  },
  {
    id: 'r3',
    name: 'Luna',
    mode: 'Arcade',
    timeAgo: '12m',
    elo: 1370,
    avatar: 'https://picsum.photos/50/50?random=13',
    countryCode: 'FR',
  },
] as const;

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
