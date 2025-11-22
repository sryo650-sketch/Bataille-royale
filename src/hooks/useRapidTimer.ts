import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GameState } from '../types/game.types';

/**
 * Hook pour calculer le timer Rapid côté client
 * Termine automatiquement la partie quand le timer atteint 0
 */
export const useRapidTimer = (gameState: GameState | null) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasEnded, setHasEnded] = useState(false);
  
  useEffect(() => {
    if (!gameState || gameState.mode !== 'rapid' || !gameState.startedAt) {
      setTimeLeft(null);
      setHasEnded(false);
      return;
    }
    
    // Si la partie est déjà terminée, ne rien faire
    if (gameState.phase === 'GAME_OVER') {
      setTimeLeft(0);
      return;
    }
    
    // Calculer le temps écoulé
    const calculateTimeLeft = async () => {
      const now = Date.now();
      const startedAt = gameState.startedAt.toMillis();
      const duration = 180 * 1000; // 180 secondes en millisecondes
      const elapsed = now - startedAt;
      const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
      
      setTimeLeft(remaining);
      
      // Si le temps est écoulé, terminer la partie (une seule fois)
      if (remaining === 0 && gameState.phase !== 'GAME_OVER' && !hasEnded && gameState.id) {
        console.log('⏱️ Timer expired, ending game...');
        setHasEnded(true);
        
        // Déterminer le gagnant par nombre de cartes
        const p1Cards = gameState.player1.deck.length;
        const p2Cards = gameState.player2.deck.length;
        const winner = p1Cards > p2Cards ? gameState.player1.uid : gameState.player2.uid;
        
        // Mettre à jour Firestore (le serveur validera)
        try {
          const gameRef = doc(db, 'games', gameState.id);
          await updateDoc(gameRef, {
            phase: 'GAME_OVER',
            status: 'finished',
            winner,
            defeatReason: 'inactivity',
          });
          console.log('✅ Game ended successfully');
        } catch (err) {
          console.error('❌ Failed to end game:', err);
          // Ne pas réessayer, juste logger l'erreur
        }
      }
    };
    
    // Calculer immédiatement
    calculateTimeLeft();
    
    // Mettre à jour chaque seconde
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, [gameState, hasEnded]);
  
  return timeLeft;
};
