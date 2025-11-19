import { Rank, Suit } from './types';

export const DECK_SIZE = 52;

export const SUIT_COLORS: Record<Suit, string> = {
  [Suit.HEARTS]: '#EF4444',
  [Suit.DIAMONDS]: '#EF4444',
  [Suit.CLUBS]: '#FFFFFF',
  [Suit.SPADES]: '#FFFFFF',
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
  { id: '1', name: 'Sarah K.', status: 'In Game', avatar: 'https://picsum.photos/50/50?random=1' },
  { id: '2', name: 'Mike D.', status: 'Online', avatar: 'https://picsum.photos/50/50?random=2' },
  { id: '3', name: 'Alex R.', status: 'Offline', avatar: 'https://picsum.photos/50/50?random=3' },
] as const;

export type FriendStatus = (typeof MOCK_FRIENDS)[number]['status'];
