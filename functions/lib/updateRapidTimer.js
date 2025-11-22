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
exports.updateRapidTimer = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Cloud Function Scheduled: Mettre à jour le timer des parties Rapid
 * Déclenchée chaque minute (économie de coûts)
 */
exports.updateRapidTimer = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async () => {
    try {
        const now = admin.firestore.Timestamp.now();
        // Récupérer toutes les parties en mode Rapid actives
        const gamesSnapshot = await db
            .collection('games')
            .where('mode', '==', 'rapid')
            .where('status', '==', 'in_progress')
            .where('rapidTimeLeft', '>', 0)
            .get();
        if (gamesSnapshot.empty) {
            // Aucune partie active
            return null;
        }
        functions.logger.info(`Updating ${gamesSnapshot.size} rapid games`);
        const batch = db.batch();
        let updatedCount = 0;
        let finishedCount = 0;
        gamesSnapshot.forEach((doc) => {
            const game = doc.data();
            const elapsed = now.seconds - game.lastTimerUpdate.seconds;
            const newTimeLeft = Math.max(0, (game.rapidTimeLeft || 0) - elapsed);
            if (newTimeLeft === 0) {
                // Temps écoulé : terminer la partie
                const p1Cards = game.player1.deck.length;
                const p2Cards = game.player2.deck.length;
                const winner = p1Cards > p2Cards ? game.player1.uid : game.player2.uid;
                batch.update(doc.ref, {
                    phase: 'GAME_OVER',
                    status: 'finished',
                    rapidTimeLeft: 0,
                    winner,
                    defeatReason: 'inactivity',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                finishedCount++;
                functions.logger.info('Game timed out', {
                    gameId: doc.id,
                    winner,
                    p1Cards,
                    p2Cards,
                });
            }
            else {
                // Mettre à jour le timer
                batch.update(doc.ref, {
                    rapidTimeLeft: newTimeLeft,
                    lastTimerUpdate: now,
                });
                updatedCount++;
            }
        });
        await batch.commit();
        functions.logger.info('Rapid timer update complete', {
            updated: updatedCount,
            finished: finishedCount,
        });
        return null;
    }
    catch (error) {
        functions.logger.error('Failed to update rapid timer', error);
        return null;
    }
});
//# sourceMappingURL=updateRapidTimer.js.map