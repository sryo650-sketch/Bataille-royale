import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UseSpecialData, GameState } from './types';

const db = admin.firestore();

/**
 * Cloud Function: Utiliser une charge spéciale
 * 
 * Input: { gameId: string, specialType: 'attack' | 'defense' }
 * Output: { success: boolean }
 */
export const useSpecial = functions.https.onCall(
  async (data: UseSpecialData, context) => {
    // ✅ Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { gameId, specialType } = data;

    if (!gameId || !specialType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'gameId and specialType are required'
      );
    }

    if (!['attack', 'defense'].includes(specialType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid special type'
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

      const player = isPlayer1 ? game.player1 : game.player2;

      // ✅ Vérifier que le joueur a des charges OU le Momentum
      if (player.specialCharges <= 0 && !player.hasMomentum) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'No charges available'
        );
      }

      // 🔥 COOLDOWN : Empêcher l'utilisation de bonus après Momentum
      if (player.hasCooldown) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Cooldown actif : Attendez le prochain round'
        );
      }

      // ✅ Vérifier que le joueur n'a pas déjà lock
      if (player.isLocked) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Already locked'
        );
      }

      // ✅ Vérifier que la phase est WAITING
      if (game.phase !== 'WAITING') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Invalid phase'
        );
      }

      // Activer la charge spéciale
      await gameRef.update({
        [`${isPlayer1 ? 'player1' : 'player2'}.usingSpecial`]: specialType,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info('Special activated', {
        gameId,
        playerId: context.auth.uid,
        specialType,
      });

      return { success: true };
    } catch (error: any) {
      functions.logger.error('Failed to use special', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Failed to use special: ' + error.message
      );
    }
  }
);
