"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRound = resolveRound;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const cardUtils_1 = require("./cardUtils");
const gameConfig_1 = require("./gameConfig");
/**
 * Résoudre un round (fonction interne)
 * Appelée quand les deux joueurs ont lock leur carte
 */
async function resolveRound(gameRef, game) {
    try {
        // Récupérer les cartes actuelles
        const p1CardId = game.player1.deck[game.player1.currentCardIndex || 0];
        const p2CardId = game.player2.deck[game.player2.currentCardIndex || 0];
        if (!p1CardId || !p2CardId) {
            // Fin de partie : un joueur n'a plus de cartes
            const winner = p1CardId ? game.player1.uid : game.player2.uid;
            await endGame(gameRef, game, winner, 'normal');
            return;
        }
        const p1Card = (0, cardUtils_1.getCardById)(p1CardId);
        const p2Card = (0, cardUtils_1.getCardById)(p2CardId);
        // Appliquer les charges spéciales
        let p1Rank = p1Card.rank;
        let p2Rank = p2Card.rank;
        if (game.player1.usingSpecial === 'attack') {
            p1Rank += gameConfig_1.GAME_CONFIG.ATTACK_BONUS;
            functions.logger.info('Player 1 used attack', { gameId: game.id, bonus: gameConfig_1.GAME_CONFIG.ATTACK_BONUS });
        }
        else if (game.player1.usingSpecial === 'defense') {
            p1Rank += gameConfig_1.GAME_CONFIG.DEFENSE_BONUS;
            functions.logger.info('Player 1 used defense', { gameId: game.id, bonus: gameConfig_1.GAME_CONFIG.DEFENSE_BONUS });
        }
        if (game.player2.usingSpecial === 'attack') {
            p2Rank += gameConfig_1.GAME_CONFIG.ATTACK_BONUS;
            functions.logger.info('Player 2 used attack', { gameId: game.id, bonus: gameConfig_1.GAME_CONFIG.ATTACK_BONUS });
        }
        else if (game.player2.usingSpecial === 'defense') {
            p2Rank += gameConfig_1.GAME_CONFIG.DEFENSE_BONUS;
            functions.logger.info('Player 2 used defense', { gameId: game.id, bonus: gameConfig_1.GAME_CONFIG.DEFENSE_BONUS });
        }
        // Déterminer le gagnant du round
        let winner;
        if (p1Rank > p2Rank) {
            winner = 'player1';
        }
        else if (p2Rank > p1Rank) {
            winner = 'player2';
        }
        else {
            winner = 'war';
        }
        functions.logger.info('Round resolved', {
            gameId: game.id,
            p1Rank,
            p2Rank,
            winner,
        });
        // Mettre à jour les decks
        const newPlayer1Deck = [...game.player1.deck];
        const newPlayer2Deck = [...game.player2.deck];
        const newPot = [...game.pot];
        // Retirer les cartes jouées des deux decks (elles sont à l'index 0)
        newPlayer1Deck.shift();
        newPlayer2Deck.shift();
        if (winner === 'player1') {
            // Player 1 gagne : récupère les cartes du pot + les 2 cartes jouées
            newPlayer1Deck.push(...newPot, p1CardId, p2CardId);
            newPot.length = 0; // Vider le pot
            game.player1.score += 1;
        }
        else if (winner === 'player2') {
            // Player 2 gagne : récupère les cartes du pot + les 2 cartes jouées
            newPlayer2Deck.push(...newPot, p1CardId, p2CardId);
            newPot.length = 0; // Vider le pot
            game.player2.score += 1;
        }
        else {
            // Égalité : ajouter les 2 cartes au pot (pour le prochain round)
            newPot.push(p1CardId, p2CardId);
        }
        // Vérifier fin de partie
        if (newPlayer1Deck.length === 0 || newPlayer2Deck.length === 0) {
            const gameWinner = newPlayer1Deck.length > 0 ? game.player1.uid : game.player2.uid;
            await endGame(gameRef, game, gameWinner, 'normal');
            return;
        }
        // Préparer le prochain round
        const nextRoundCount = game.roundCount + 1;
        // 🔥 MOMENTUM : Si un joueur gagne avec un bonus activé, il obtient un bonus gratuit au prochain round
        let p1Momentum = false;
        let p2Momentum = false;
        if (winner === 'player1' && game.player1.usingSpecial !== null) {
            p1Momentum = true;
            functions.logger.info('Player 1 gained momentum', { gameId: game.id });
        }
        else if (winner === 'player2' && game.player2.usingSpecial !== null) {
            p2Momentum = true;
            functions.logger.info('Player 2 gained momentum', { gameId: game.id });
        }
        // 🔥 COOLDOWN : Si le joueur a utilisé le Momentum ce round, activer le cooldown
        // Sinon, désactiver le cooldown (round normal écoulé)
        const p1Cooldown = game.player1.hasMomentum && game.player1.usingSpecial !== null;
        const p2Cooldown = game.player2.hasMomentum && game.player2.usingSpecial !== null;
        if (p1Cooldown) {
            functions.logger.info('Player 1 cooldown activated', { gameId: game.id });
        }
        if (p2Cooldown) {
            functions.logger.info('Player 2 cooldown activated', { gameId: game.id });
        }
        // Vérifier si un joueur gagne une charge (tous les 10 rounds)
        let p1NewCharges = game.player1.specialCharges;
        let p2NewCharges = game.player2.specialCharges;
        if (nextRoundCount % gameConfig_1.GAME_CONFIG.CHARGE_UNLOCK_INTERVAL === 0) {
            if (game.mode !== 'rapid') {
                // En mode Classic, gagner une charge (max configuré)
                p1NewCharges = Math.min(gameConfig_1.GAME_CONFIG.MAX_CHARGES, p1NewCharges + 1);
                p2NewCharges = Math.min(gameConfig_1.GAME_CONFIG.MAX_CHARGES, p2NewCharges + 1);
                functions.logger.info('Charges unlocked', { gameId: game.id, round: nextRoundCount });
            }
        }
        // 🐙 KRAKEN : Tous les 15 rounds, dévorer la carte la plus faible de chaque deck
        let krakenP1Card = null;
        let krakenP2Card = null;
        if (nextRoundCount % 15 === 0 && newPlayer1Deck.length > 0 && newPlayer2Deck.length > 0) {
            // Trouver la carte la plus faible du deck de chaque joueur
            const p1Ranks = newPlayer1Deck.map(cardId => (0, cardUtils_1.getCardById)(cardId).rank);
            const p2Ranks = newPlayer2Deck.map(cardId => (0, cardUtils_1.getCardById)(cardId).rank);
            const lowestP1Rank = Math.min(...p1Ranks);
            const lowestP2Rank = Math.min(...p2Ranks);
            // Trouver l'index de la première occurrence de cette carte
            const p1IndexToRemove = newPlayer1Deck.findIndex(cardId => (0, cardUtils_1.getCardById)(cardId).rank === lowestP1Rank);
            const p2IndexToRemove = newPlayer2Deck.findIndex(cardId => (0, cardUtils_1.getCardById)(cardId).rank === lowestP2Rank);
            if (p1IndexToRemove !== -1) {
                krakenP1Card = newPlayer1Deck[p1IndexToRemove];
                newPlayer1Deck.splice(p1IndexToRemove, 1);
            }
            if (p2IndexToRemove !== -1) {
                krakenP2Card = newPlayer2Deck[p2IndexToRemove];
                newPlayer2Deck.splice(p2IndexToRemove, 1);
            }
            functions.logger.info('Kraken event triggered', {
                gameId: game.id,
                roundCount: nextRoundCount,
                p1CardRemoved: krakenP1Card,
                p2CardRemoved: krakenP2Card,
            });
        }
        // Vérifier fin de partie APRÈS le Kraken
        if (newPlayer1Deck.length === 0 || newPlayer2Deck.length === 0) {
            const gameWinner = newPlayer1Deck.length > 0 ? game.player1.uid : game.player2.uid;
            await endGame(gameRef, game, gameWinner, 'normal');
            return;
        }
        // Mettre à jour l'état
        await gameRef.update({
            'player1.deck': newPlayer1Deck,
            'player1.currentCardIndex': 0,
            'player1.score': game.player1.score,
            'player1.specialCharges': p1NewCharges,
            'player1.isLocked': false,
            'player1.usingSpecial': null,
            'player1.hasMomentum': p1Momentum,
            'player1.hasCooldown': p1Cooldown,
            'player2.deck': newPlayer2Deck,
            'player2.currentCardIndex': 0,
            'player2.score': game.player2.score,
            'player2.specialCharges': p2NewCharges,
            'player2.isLocked': false,
            'player2.usingSpecial': null,
            'player2.hasMomentum': p2Momentum,
            'player2.hasCooldown': p2Cooldown,
            pot: newPot,
            phase: 'WAITING',
            roundCount: nextRoundCount,
            krakenEvent: (krakenP1Card || krakenP2Card) ? { p1Card: krakenP1Card, p2Card: krakenP2Card } : null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info('Next round prepared', {
            gameId: game.id,
            roundCount: nextRoundCount,
            p1Cards: newPlayer1Deck.length,
            p2Cards: newPlayer2Deck.length,
        });
    }
    catch (error) {
        functions.logger.error('Failed to resolve round', error);
        throw error;
    }
}
/**
 * Terminer la partie
 */
async function endGame(gameRef, game, winner, defeatReason) {
    await gameRef.update({
        phase: 'GAME_OVER',
        status: 'finished',
        winner,
        defeatReason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    functions.logger.info('Game ended', {
        gameId: game.id,
        winner,
        defeatReason,
        mode: game.mode,
    });
    // TODO: Enregistrer les stats dans la collection 'matches'
    // TODO: Mettre à jour l'ELO des joueurs (mode Classic uniquement)
}
//# sourceMappingURL=resolveRound.js.map