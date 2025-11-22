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
exports.surrender = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Cloud Function: Abandonner la partie
 *
 * Input: { gameId: string }
 * Output: { success: boolean }
 */
exports.surrender = functions.https.onCall(async (data, context) => {
    // ✅ Vérifier l'authentification
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { gameId } = data;
    if (!gameId) {
        throw new functions.https.HttpsError('invalid-argument', 'gameId is required');
    }
    try {
        const gameRef = db.collection('games').doc(gameId);
        const gameDoc = await gameRef.get();
        if (!gameDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Game not found');
        }
        const game = gameDoc.data();
        // ✅ Vérifier que le joueur fait partie de la partie
        const isPlayer1 = game.player1.uid === context.auth.uid;
        const isPlayer2 = game.player2.uid === context.auth.uid;
        if (!isPlayer1 && !isPlayer2) {
            throw new functions.https.HttpsError('permission-denied', 'Not a player in this game');
        }
        // ✅ Vérifier que la partie n'est pas déjà terminée
        if (game.phase === 'GAME_OVER') {
            throw new functions.https.HttpsError('failed-precondition', 'Game already over');
        }
        // Le gagnant est l'adversaire
        const winner = isPlayer1 ? game.player2.uid : game.player1.uid;
        // Terminer la partie
        await gameRef.update({
            phase: 'GAME_OVER',
            status: 'finished',
            winner,
            defeatReason: 'surrender',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info('Player surrendered', {
            gameId,
            playerId: context.auth.uid,
            winner,
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error('Failed to surrender', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to surrender: ' + error.message);
    }
});
//# sourceMappingURL=surrender.js.map