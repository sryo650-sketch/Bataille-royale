import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GameState } from './types';
import { GAME_CONFIG } from './gameConfig';

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
export const checkInactivity = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    try {
      const now = admin.firestore.Timestamp.now();
      const timeoutThreshold = now.seconds - GAME_CONFIG.ROUND_TIMEOUT;

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
        const game = gameDoc.data() as GameState;
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

            if (newTimeoutCount >= GAME_CONFIG.MAX_TIMEOUTS) {
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
            } else {
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

            if (newTimeoutCount >= GAME_CONFIG.MAX_TIMEOUTS) {
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
            } else {
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
    } catch (error: any) {
      functions.logger.error('Failed to check inactivity', error);
      return null;
    }
  });
