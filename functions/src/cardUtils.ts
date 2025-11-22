import { CardData, Rank, Suit } from './types';

/**
 * Créer un deck complet de 52 cartes
 */
export const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const ranks = [
    Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
    Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
  ];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${rank}${suit}`,
        suit,
        rank,
      });
    }
  }

  return deck;
};

/**
 * Mélanger un deck (Fisher-Yates)
 */
export const shuffleDeck = (deck: CardData[]): CardData[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Diviser un deck en deux
 */
export const splitDeck = (deck: CardData[]): [CardData[], CardData[]] => {
  const mid = Math.floor(deck.length / 2);
  return [deck.slice(0, mid), deck.slice(mid)];
};

/**
 * Récupérer une carte par son ID
 */
export const getCardById = (cardId: string): CardData => {
  const suitChar = cardId.slice(-1);
  const rankStr = cardId.slice(0, -1);
  
  const suitMap: Record<string, Suit> = {
    '♥': Suit.HEARTS,
    '♦': Suit.DIAMONDS,
    '♣': Suit.CLUBS,
    '♠': Suit.SPADES,
  };
  
  const suit = suitMap[suitChar];
  const rank = parseInt(rankStr) as Rank;
  
  return {
    id: cardId,
    suit,
    rank,
  };
};

/**
 * Convertir un deck en IDs
 */
export const deckToIds = (deck: CardData[]): string[] => {
  return deck.map(card => card.id);
};
