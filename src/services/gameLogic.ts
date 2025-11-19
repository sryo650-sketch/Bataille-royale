import { CardData, Rank, Suit } from '../types';

export const createDeck = (): CardData[] => {
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const ranks = [
    Rank.TWO,
    Rank.THREE,
    Rank.FOUR,
    Rank.FIVE,
    Rank.SIX,
    Rank.SEVEN,
    Rank.EIGHT,
    Rank.NINE,
    Rank.TEN,
    Rank.JACK,
    Rank.QUEEN,
    Rank.KING,
    Rank.ACE,
  ];

  const deck: CardData[] = [];
  let idCounter = 0;

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `card-${idCounter++}`,
        suit,
        rank,
        isFaceUp: false,
      });
    }
  }

  return deck;
};

export const shuffleDeck = (deck: CardData[]): CardData[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const splitDeck = (deck: CardData[]): [CardData[], CardData[]] => {
  const mid = Math.floor(deck.length / 2);
  return [deck.slice(0, mid), deck.slice(mid)];
};
