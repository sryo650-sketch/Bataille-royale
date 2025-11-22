import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GameState } from '../types/game.types';

/**
 * Hook pour écouter l'état d'une partie en temps réel
 * Le serveur est la source unique de vérité
 */
export const useGameRealtime = (gameId: string | null) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const unsubscribe = onSnapshot(
      doc(db, 'games', gameId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { ...snapshot.data(), id: snapshot.id } as GameState;
          console.log('🎮 Game state updated:', {
            id: data.id,
            round: data.roundCount,
            phase: data.phase,
            p1Cards: data.player1.deck.length,
            p2Cards: data.player2.deck.length,
            p1Locked: data.player1.isLocked,
            p2Locked: data.player2.isLocked,
          });
          setGameState(data);
        } else {
          setError('Game not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Game listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [gameId]);
  
  return { gameState, loading, error };
};
