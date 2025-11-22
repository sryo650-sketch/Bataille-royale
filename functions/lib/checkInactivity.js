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
exports.checkInactivity = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const gameConfig_1 = require("./gameConfig");
const db = admin.firestore();
/**
 * Cloud Function Scheduled: Vérifier l'inactivité et auto-lock
 * Déclenchée chaque minute
 *
 * Si un joueur ne lock pas dans les ROUND_TIMEOUT secondes :
 * 1. Auto-lock pour lui
 * 2. Incrémenter son timeoutCount
 * 3. Si timeoutCount >= MAX_TIMEOUTS : défaite automatique
 */
exports.checkInactivity = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async () => {
    try {
        const now = admin.firestore.Timestamp.now();
        const timeoutThreshold = now.seconds - gameConfig_1.GAME_CONFIG.ROUND_TIMEOUT;
        // Récupérer les parties en cours en mode Rapid
        const gamesSnapshot = await db
            .collection('games')
            .where('mode', '==', 'rapid')
            .where('status', '==', 'in_progress')
            .where('phase', '==', 'WAITING')
            .get();
        if (gamesSnapshot.empty) {
            return null;
        }
        const batch = db.batch();
        let processedGames = 0;
        for (const gameDoc of gamesSnapshot.docs) {
            const game = gameDoc.data();
            const gameRef = gameDoc.ref;
            // Vérifier si la dernière action est trop ancienne
            if (game.lastActionAt.seconds < timeoutThreshold) {
                // Déterminer quel joueur n'a pas lock
                const p1NeedsLock = !game.player1.isLocked;
                const p2NeedsLock = !game.player2.isLocked;
                if (!p1NeedsLock && !p2NeedsLock) {
                    // Les deux ont lock, pas de timeout
                    continue;
                }
                // Incrémenter le compteur de timeout
                if (p1NeedsLock) {
                    const newTimeoutCount = game.player1.timeoutCount + 1;
                    if (newTimeoutCount >= gameConfig_1.GAME_CONFIG.MAX_TIMEOUTS) {
                        // Défaite automatique pour P1
                        batch.update(gameRef, {
                            phase: 'GAME_OVER',
                            status: 'finished',
                            winner: game.player2.uid,
                            defeatReason: 'inactivity',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        functions.logger.info('Player 1 defeated by inactivity', {
                            gameId: gameDoc.id,
                            timeoutCount: newTimeoutCount,
                        });
                    }
                    else {
                        // Auto-lock pour P1
                        batch.update(gameRef, {
                            'player1.isLocked': true,
                            'player1.timeoutCount': newTimeoutCount,
                            lastActionAt: now,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        functions.logger.info('Player 1 auto-locked', {
                            gameId: gameDoc.id,
                            timeoutCount: newTimeoutCount,
                        });
                    }
                }
                if (p2NeedsLock && game.player2.uid !== 'bot') {
                    const newTimeoutCount = game.player2.timeoutCount + 1;
                    if (newTimeoutCount >= gameConfig_1.GAME_CONFIG.MAX_TIMEOUTS) {
                        // Défaite automatique pour P2
                        batch.update(gameRef, {
                            phase: 'GAME_OVER',
                            status: 'finished',
                            winner: game.player1.uid,
                            defeatReason: 'inactivity',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        functions.logger.info('Player 2 defeated by inactivity', {
                            gameId: gameDoc.id,
                            timeoutCount: newTimeoutCount,
                        });
                    }
                    else {
                        // Auto-lock pour P2
                        batch.update(gameRef, {
                            'player2.isLocked': true,
                            'player2.timeoutCount': newTimeoutCount,
                            lastActionAt: now,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        functions.logger.info('Player 2 auto-locked', {
                            gameId: gameDoc.id,
                            timeoutCount: newTimeoutCount,
                        });
                    }
                }
                processedGames++;
            }
        }
        if (processedGames > 0) {
            await batch.commit();
            functions.logger.info('Inactivity check completed', { processedGames });
        }
        return null;
    }
    catch (error) {
        functions.logger.error('Failed to check inactivity', error);
        return null;
    }
});
//# sourceMappingURL=checkInactivity.js.map