import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GameState } from './types';

const db = admin.firestore();

/**
 * Cloud Function Scheduled: Mettre à jour le timer des parties Rapid
 * Déclenchée chaque minute (économie de coûts)
 */
export const updateRapidTimer = functions.pubsub
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
        const game = doc.data() as GameState;
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
        } else {
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
    } catch (error: any) {
      functions.logger.error('Failed to update rapid timer', error);
      return null;
    }
  });
