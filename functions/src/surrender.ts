import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GameActionData, GameState } from './types';

const db = admin.firestore();

/**
 * Cloud Function: Abandonner la partie
 * 
 * Input: { gameId: string }
 * Output: { success: boolean }
 */
export const surrender = functions.https.onCall(
  async (data: GameActionData, context) => {
    // ✅ Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { gameId } = data;

    if (!gameId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'gameId is required'
      );
    }

    try {
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();

      if (!gameDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Game not found'
        );
      }

      const game = gameDoc.data() as GameState;

      // ✅ Vérifier que le joueur fait partie de la partie
      const isPlayer1 = game.player1.uid === context.auth.uid;
      const isPlayer2 = game.player2.uid === context.auth.uid;

      if (!isPlayer1 && !isPlayer2) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Not a player in this game'
        );
      }

      // ✅ Vérifier que la partie n'est pas déjà terminée
      if (game.phase === 'GAME_OVER') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Game already over'
        );
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
    } catch (error: any) {
      functions.logger.error('Failed to surrender', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Failed to surrender: ' + error.message
      );
    }
  }
);
