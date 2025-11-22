import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { CreateGameData, GameState, PlayerState } from './types';
import { createDeck, shuffleDeck, splitDeck, deckToIds } from './cardUtils';
import { GAME_CONFIG } from './gameConfig';

const db = admin.firestore();

/**
 * Cloud Function: Créer une nouvelle partie
 * 
 * Input: { mode: 'classic' | 'rapid' | 'daily', opponentId?: string }
 * Output: { gameId: string }
 */
export const createGame = functions.https.onCall(
  async (data: CreateGameData, context) => {
    // ✅ Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { mode, opponentId } = data;

    // ✅ Valider le mode
    if (!['classic', 'rapid', 'daily'].includes(mode)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid game mode'
      );
    }

    try {
      // Récupérer les infos du joueur 1
      const player1Doc = await db.collection('users').doc(context.auth.uid).get();
      const player1Data = player1Doc.data();

      if (!player1Data) {
        throw new functions.https.HttpsError(
          'not-found',
          'Player profile not found'
        );
      }

      // Créer et mélanger le deck
      const fullDeck = shuffleDeck(createDeck());
      const [p1Deck, p2Deck] = splitDeck(fullDeck);

      // État du joueur 1
      const player1: PlayerState = {
        uid: context.auth.uid,
        name: player1Data.name || 'Player 1',
        countryCode: player1Data.countryCode || 'FR',
        ...(player1Data.photoURL && { avatar: player1Data.photoURL }),
        deck: deckToIds(p1Deck),
        currentCardIndex: 0,
        score: 0,
        specialCharges: mode === 'rapid' 
          ? GAME_CONFIG.RAPID_STARTING_CHARGES 
          : GAME_CONFIG.CLASSIC_STARTING_CHARGES,
        isLocked: false,
        usingSpecial: null,
        timeoutCount: 0,
        hasMomentum: false,
        hasCooldown: false,
        maxPV: 26,
        krakensCount: 0,
      };

      // État du joueur 2 (adversaire ou bot)
      let player2: PlayerState;

      if (opponentId && opponentId !== 'bot') {
        // Jouer contre un joueur réel
        const player2Doc = await db.collection('users').doc(opponentId).get();
        const player2Data = player2Doc.data();

        if (!player2Data) {
          throw new functions.https.HttpsError(
            'not-found',
            'Opponent profile not found'
          );
        }

        player2 = {
          uid: opponentId,
          name: player2Data.name || 'Player 2',
          countryCode: player2Data.countryCode || 'FR',
          ...(player2Data.photoURL && { avatar: player2Data.photoURL }),
          deck: deckToIds(p2Deck),
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
      } else {
        // Jouer contre un bot
        player2 = {
          uid: 'bot',
          name: 'Adversaire',
          countryCode: 'FR',
          deck: deckToIds(p2Deck),
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
      const gameState: Omit<GameState, 'id'> = {
        mode,
        status: 'in_progress',
        player1,
        player2,
        phase: 'WAITING',
        pot: [],
        roundCount: 0,
        startedAt: now,
        rapidTimeLeft: mode === 'rapid' ? GAME_CONFIG.RAPID_MODE_DURATION : null,
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
    } catch (error: any) {
      functions.logger.error('Failed to create game', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to create game: ' + error.message
      );
    }
  }
);
