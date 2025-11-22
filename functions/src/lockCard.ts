import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GameActionData, GameState } from './types';
import { resolveRound } from './resolveRound';
import { GAME_CONFIG, determineWinnerOnTimeout } from './gameConfig';

const db = admin.firestore();

/**
 * Cloud Function: Verrouiller la carte du joueur
 * 
 * Input: { gameId: string }
 * Output: { success: boolean }
 */
export const lockCard = functions.https.onCall(
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

      // ✅ Vérifier si le timer Rapid est écoulé
      if (game.mode === 'rapid' && game.startedAt && GAME_CONFIG.DEFEAT_CONDITIONS.RAPID_TIMEOUT_ENABLED) {
        const now = admin.firestore.Timestamp.now();
        const elapsed = now.seconds - game.startedAt.seconds;
        
        if (elapsed >= GAME_CONFIG.RAPID_MODE_DURATION) {
          // Temps écoulé : terminer la partie
          const { winner } = determineWinnerOnTimeout(
            game.player1.deck.length,
            game.player2.deck.length,
            game.player1.score,
            game.player2.score,
            'rapid'
          );
          const winnerId = winner === 'player1' ? game.player1.uid : game.player2.uid;
          
          await gameRef.update({
            phase: 'GAME_OVER',
            status: 'finished',
            winner: winnerId,
            defeatReason: 'inactivity',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          functions.logger.info('Game timed out', { 
            gameId, 
            winner: winnerId, 
            p1Cards: game.player1.deck.length, 
            p2Cards: game.player2.deck.length 
          });
          
          throw new functions.https.HttpsError(
            'deadline-exceeded',
            'Game time expired'
          );
        }
      }

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
      const opponent = isPlayer1 ? game.player2 : game.player1;

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

      // 🔥 MOMENTUM : Déduire la charge si une charge spéciale est utilisée
      if (player.usingSpecial) {
        if (player.hasMomentum) {
          // Bonus GRATUIT grâce au momentum
          functions.logger.info('Momentum used - free special', { 
            gameId, 
            playerId: context.auth.uid 
          });
          player.hasMomentum = false; // Consommer le momentum
        } else {
          // Coût normal
          player.specialCharges = Math.max(0, player.specialCharges - 1);
        }
      }

      // Verrouiller le joueur
      player.isLocked = true;

      // Mettre à jour l'état du joueur
      await gameRef.update({
        [`${isPlayer1 ? 'player1' : 'player2'}`]: player,
        lastActionAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info('Card locked', {
        gameId,
        playerId: context.auth.uid,
        usingSpecial: player.usingSpecial,
      });

      // Si l'adversaire est un bot, le faire lock automatiquement
      if (opponent.uid === 'bot' && !opponent.isLocked) {
        functions.logger.info('Bot auto-locking', { gameId });
        
        // Le bot lock immédiatement
        opponent.isLocked = true;
        
        await gameRef.update({
          [`${isPlayer1 ? 'player2' : 'player1'}`]: opponent,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Résoudre le round
        functions.logger.info('Both players locked, resolving round', { gameId });
        await resolveRound(gameRef, game);
      } else if (opponent.isLocked) {
        // Si l'adversaire humain a déjà lock, résoudre
        functions.logger.info('Both players locked, resolving round', { gameId });
        await resolveRound(gameRef, game);
      }

      return { success: true };
    } catch (error: any) {
      functions.logger.error('Failed to lock card', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Failed to lock card: ' + error.message
      );
    }
  }
);
