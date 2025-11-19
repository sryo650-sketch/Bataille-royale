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
  isFaceUp: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  countryCode?: string;
  deck: CardData[];
  currentCard?: CardData;
  isLocked: boolean;
  score: number;
}

export enum GamePhase {
  WAITING = 'WAITING',
  LOCKED = 'LOCKED',
  REVEALING = 'REVEALING',
  RESOLVING = 'RESOLVING',
  BATTLE = 'BATTLE',
  GAME_OVER = 'GAME_OVER',
}

export enum Screen {
  HOME = 'HOME',
  GAME = 'GAME',
  STATS = 'STATS',
}
