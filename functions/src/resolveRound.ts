import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { GameState } from './types';
import { getCardById } from './cardUtils';
import { GAME_CONFIG } from './gameConfig';

/**
 * Résoudre un round (fonction interne)
 * Appelée quand les deux joueurs ont lock leur carte
 */
export async function resolveRound(
  gameRef: admin.firestore.DocumentReference,
  game: GameState
): Promise<void> {
  try {
    // Récupérer les cartes actuelles
    const p1CardId = game.player1.deck[game.player1.currentCardIndex || 0];
    const p2CardId = game.player2.deck[game.player2.currentCardIndex || 0];

    if (!p1CardId || !p2CardId) {
      // Fin de partie : un joueur n'a plus de cartes
      const winner = p1CardId ? game.player1.uid : game.player2.uid;
      await endGame(gameRef, game, winner, 'normal');
      return;
    }

    const p1Card = getCardById(p1CardId);
    const p2Card = getCardById(p2CardId);

    // Appliquer les charges spéciales
    let p1Rank = p1Card.rank;
    let p2Rank = p2Card.rank;

    if (game.player1.usingSpecial === 'attack') {
      p1Rank += GAME_CONFIG.ATTACK_BONUS;
      functions.logger.info('Player 1 used attack', { gameId: game.id, bonus: GAME_CONFIG.ATTACK_BONUS });
    } else if (game.player1.usingSpecial === 'defense') {
      p1Rank += GAME_CONFIG.DEFENSE_BONUS;
      functions.logger.info('Player 1 used defense', { gameId: game.id, bonus: GAME_CONFIG.DEFENSE_BONUS });
    }

    if (game.player2.usingSpecial === 'attack') {
      p2Rank += GAME_CONFIG.ATTACK_BONUS;
      functions.logger.info('Player 2 used attack', { gameId: game.id, bonus: GAME_CONFIG.ATTACK_BONUS });
    } else if (game.player2.usingSpecial === 'defense') {
      p2Rank += GAME_CONFIG.DEFENSE_BONUS;
      functions.logger.info('Player 2 used defense', { gameId: game.id, bonus: GAME_CONFIG.DEFENSE_BONUS });
    }

    // Déterminer le gagnant du round
    let winner: 'player1' | 'player2' | 'war';
    if (p1Rank > p2Rank) {
      winner = 'player1';
    } else if (p2Rank > p1Rank) {
      winner = 'player2';
    } else {
      winner = 'war';
    }

    functions.logger.info('Round resolved', {
      gameId: game.id,
      p1Rank,
      p2Rank,
      winner,
    });

    // Mettre à jour les decks
    const newPlayer1Deck = [...game.player1.deck];
    const newPlayer2Deck = [...game.player2.deck];
    const newPot = [...game.pot];

    // Retirer les cartes jouées des deux decks (elles sont à l'index 0)
    newPlayer1Deck.shift();
    newPlayer2Deck.shift();

    if (winner === 'player1') {
      // Player 1 gagne : récupère les cartes du pot + les 2 cartes jouées
      newPlayer1Deck.push(...newPot, p1CardId, p2CardId);
      newPot.length = 0; // Vider le pot
      game.player1.score += 1;
    } else if (winner === 'player2') {
      // Player 2 gagne : récupère les cartes du pot + les 2 cartes jouées
      newPlayer2Deck.push(...newPot, p1CardId, p2CardId);
      newPot.length = 0; // Vider le pot
      game.player2.score += 1;
    } else {
      // Égalité : ajouter les 2 cartes au pot (pour le prochain round)
      newPot.push(p1CardId, p2CardId);
    }

    // Vérifier fin de partie
    if (newPlayer1Deck.length === 0 || newPlayer2Deck.length === 0) {
      const gameWinner = newPlayer1Deck.length > 0 ? game.player1.uid : game.player2.uid;
      await endGame(gameRef, game, gameWinner, 'normal');
      return;
    }

    // Préparer le prochain round
    const nextRoundCount = game.roundCount + 1;

    // Vérifier si un joueur gagne une charge (tous les 10 rounds)
    let p1NewCharges = game.player1.specialCharges;
    let p2NewCharges = game.player2.specialCharges;

    if (nextRoundCount % GAME_CONFIG.CHARGE_UNLOCK_INTERVAL === 0) {
      if (game.mode !== 'rapid') {
        // En mode Classic, gagner une charge (max configuré)
        p1NewCharges = Math.min(GAME_CONFIG.MAX_CHARGES, p1NewCharges + 1);
        p2NewCharges = Math.min(GAME_CONFIG.MAX_CHARGES, p2NewCharges + 1);
        functions.logger.info('Charges unlocked', { gameId: game.id, round: nextRoundCount });
      }
    }

    // Mettre à jour l'état
    await gameRef.update({
      'player1.deck': newPlayer1Deck,
      'player1.currentCardIndex': 0,
      'player1.score': game.player1.score,
      'player1.specialCharges': p1NewCharges,
      'player1.isLocked': false,
      'player1.usingSpecial': null,
      'player2.deck': newPlayer2Deck,
      'player2.currentCardIndex': 0,
      'player2.score': game.player2.score,
      'player2.specialCharges': p2NewCharges,
      'player2.isLocked': false,
      'player2.usingSpecial': null,
      pot: newPot,
      phase: 'WAITING',
      roundCount: nextRoundCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info('Next round prepared', {
      gameId: game.id,
      roundCount: nextRoundCount,
      p1Cards: newPlayer1Deck.length,
      p2Cards: newPlayer2Deck.length,
    });
  } catch (error: any) {
    functions.logger.error('Failed to resolve round', error);
    throw error;
  }
}

/**
 * Terminer la partie
 */
async function endGame(
  gameRef: admin.firestore.DocumentReference,
  game: GameState,
  winner: string,
  defeatReason: 'normal' | 'inactivity' | 'surrender'
): Promise<void> {
  await gameRef.update({
    phase: 'GAME_OVER',
    status: 'finished',
    winner,
    defeatReason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  functions.logger.info('Game ended', {
    gameId: game.id,
    winner,
    defeatReason,
    mode: game.mode,
  });

  // TODO: Enregistrer les stats dans la collection 'matches'
  // TODO: Mettre à jour l'ELO des joueurs (mode Classic uniquement)
}
