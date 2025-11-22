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
exports.createGame = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cardUtils_1 = require("./cardUtils");
const gameConfig_1 = require("./gameConfig");
const db = admin.firestore();
/**
 * Cloud Function: Créer une nouvelle partie
 *
 * Input: { mode: 'classic' | 'rapid' | 'daily', opponentId?: string }
 * Output: { gameId: string }
 */
exports.createGame = functions.https.onCall(async (data, context) => {
    // ✅ Vérifier l'authentification
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { mode, opponentId } = data;
    // ✅ Valider le mode
    if (!['classic', 'rapid', 'daily'].includes(mode)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid game mode');
    }
    try {
        // Récupérer les infos du joueur 1
        const player1Doc = await db.collection('users').doc(context.auth.uid).get();
        const player1Data = player1Doc.data();
        if (!player1Data) {
            throw new functions.https.HttpsError('not-found', 'Player profile not found');
        }
        // Créer et mélanger le deck
        const fullDeck = (0, cardUtils_1.shuffleDeck)((0, cardUtils_1.createDeck)());
        const [p1Deck, p2Deck] = (0, cardUtils_1.splitDeck)(fullDeck);
        // État du joueur 1
        const player1 = Object.assign(Object.assign({ uid: context.auth.uid, name: player1Data.name || 'Player 1', countryCode: player1Data.countryCode || 'FR' }, (player1Data.photoURL && { avatar: player1Data.photoURL })), { deck: (0, cardUtils_1.deckToIds)(p1Deck), currentCardIndex: 0, score: 0, specialCharges: mode === 'rapid'
                ? gameConfig_1.GAME_CONFIG.RAPID_STARTING_CHARGES
                : gameConfig_1.GAME_CONFIG.CLASSIC_STARTING_CHARGES, isLocked: false, usingSpecial: null, timeoutCount: 0, hasMomentum: false, hasCooldown: false, maxPV: 26, krakensCount: 0 });
        // État du joueur 2 (adversaire ou bot)
        let player2;
        if (opponentId && opponentId !== 'bot') {
            // Jouer contre un joueur réel
            const player2Doc = await db.collection('users').doc(opponentId).get();
            const player2Data = player2Doc.data();
            if (!player2Data) {
                throw new functions.https.HttpsError('not-found', 'Opponent profile not found');
            }
            player2 = Object.assign(Object.assign({ uid: opponentId, name: player2Data.name || 'Player 2', countryCode: player2Data.countryCode || 'FR' }, (player2Data.photoURL && { avatar: player2Data.photoURL })), { deck: (0, cardUtils_1.deckToIds)(p2Deck), currentCardIndex: 0, score: 0, specialCharges: 0, isLocked: false, usingSpecial: null, timeoutCount: 0, hasMomentum: false, hasCooldown: false, maxPV: 26, krakensCount: 0 });
        }
        else {
            // Jouer contre un bot
            player2 = {
                uid: 'bot',
                name: 'Adversaire',
                countryCode: 'FR',
                deck: (0, cardUtils_1.deckToIds)(p2Deck),
                currentCardIndex: 0,
                score: 0,
                specialCharges: 0,
                isLocked: false,
                usingSpecial: null,
                timeoutCount: 0,
                hasMomentum: false,
                hasCooldown: false,
                maxPV: 26,
                krakensCount: 0,
            };
        }
        // Créer l'état initial de la partie
        const now = admin.firestore.Timestamp.now();
        const gameState = {
            mode,
            status: 'in_progress',
            player1,
            player2,
            phase: 'WAITING',
            pot: [],
            roundCount: 0,
            startedAt: now,
            rapidTimeLeft: mode === 'rapid' ? gameConfig_1.GAME_CONFIG.RAPID_MODE_DURATION : null,
            lastTimerUpdate: now,
            lastActionAt: now,
            winner: null,
            defeatReason: null,
            krakenEvent: null,
            createdAt: now,
            updatedAt: now,
        };
        // Sauvegarder dans Firestore
        const gameRef = await db.collection('games').add(gameState);
        functions.logger.info('Game created', {
            gameId: gameRef.id,
            mode,
            player1: player1.uid,
            player2: player2.uid,
        });
        return { gameId: gameRef.id };
    }
    catch (error) {
        functions.logger.error('Failed to create game', error);
        throw new functions.https.HttpsError('internal', 'Failed to create game: ' + error.message);
    }
});
//# sourceMappingURL=createGame.js.map