"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deckToIds = exports.getCardById = exports.splitDeck = exports.shuffleDeck = exports.createDeck = void 0;
const types_1 = require("./types");
/**
 * Créer un deck complet de 52 cartes
 */
const createDeck = () => {
    const deck = [];
    const suits = [types_1.Suit.HEARTS, types_1.Suit.DIAMONDS, types_1.Suit.CLUBS, types_1.Suit.SPADES];
    const ranks = [
        types_1.Rank.TWO, types_1.Rank.THREE, types_1.Rank.FOUR, types_1.Rank.FIVE, types_1.Rank.SIX, types_1.Rank.SEVEN,
        types_1.Rank.EIGHT, types_1.Rank.NINE, types_1.Rank.TEN, types_1.Rank.JACK, types_1.Rank.QUEEN, types_1.Rank.KING, types_1.Rank.ACE
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
exports.createDeck = createDeck;
/**
 * Mélanger un deck (Fisher-Yates)
 */
const shuffleDeck = (deck) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};
exports.shuffleDeck = shuffleDeck;
/**
 * Diviser un deck en deux
 */
const splitDeck = (deck) => {
    const mid = Math.floor(deck.length / 2);
    return [deck.slice(0, mid), deck.slice(mid)];
};
exports.splitDeck = splitDeck;
/**
 * Récupérer une carte par son ID
 */
const getCardById = (cardId) => {
    const suitChar = cardId.slice(-1);
    const rankStr = cardId.slice(0, -1);
    const suitMap = {
        '♥': types_1.Suit.HEARTS,
        '♦': types_1.Suit.DIAMONDS,
        '♣': types_1.Suit.CLUBS,
        '♠': types_1.Suit.SPADES,
    };
    const suit = suitMap[suitChar];
    const rank = parseInt(rankStr);
    return {
        id: cardId,
        suit,
        rank,
    };
};
exports.getCardById = getCardById;
/**
 * Convertir un deck en IDs
 */
const deckToIds = (deck) => {
    return deck.map(card => card.id);
};
exports.deckToIds = deckToIds;
//# sourceMappingURL=cardUtils.js.map