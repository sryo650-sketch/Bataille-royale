import { useEffect, useRef, useState } from 'react';
import { GameState } from '../types/game.types';

/**
 * Hook pour auto-lock après 10 secondes d'inactivité
 * Appelle automatiquement lockCard si le joueur ne lock pas
 * 6 auto-locks d'affilée = défaite automatique
 */
export const useInactivityTimer = (
  gameState: GameState | null,
  isCurrentPlayer: boolean,
  onAutoLock: () => void,
  onDefeat?: () => void
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoLockCountRef = useRef<number>(0);
  const lastRoundRef = useRef<number>(0);
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Nettoyer les timers précédents
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    timerRef.current = null;
    intervalRef.current = null;
    setTimeLeft(null);

    // Conditions pour activer le timer
    if (
      !gameState ||
      gameState.mode !== 'rapid' ||
      gameState.phase !== 'WAITING' ||
      !isCurrentPlayer
    ) {
      return;
    }

    // TODO: Déterminer correctement si c'est player1 ou player2
    // Pour l'instant, on suppose que l'appelant gère isCurrentPlayer correctement
    // Mais il faut vérifier isLocked du bon joueur
    // On peut passer isLocked en argument du hook pour être sûr
    
    // Calculer le temps écoulé depuis la dernière action
    const now = Date.now();
    const lastAction = gameState.lastActionAt?.toMillis() || now;
    const elapsed = (now - lastAction) / 1000; // en secondes
    const TIMEOUT = 10; // 10 secondes
    
    const remaining = Math.max(0, Math.ceil(TIMEOUT - elapsed));
    setTimeLeft(remaining);

    if (remaining <= 0) {
      console.log('⏱️ Timeout dépassé, auto-lock immédiat');
      onAutoLock();
      return;
    }

    // Intervalle pour décompte visuel
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    // Timeout pour action
    timerRef.current = setTimeout(() => {
      autoLockCountRef.current += 1;
      console.log(`⏱️ Timeout ! Auto-lock #${autoLockCountRef.current}/6`);

      if (autoLockCountRef.current >= 6) {
        console.log('❌ 6 auto-locks d\'affilée → DÉFAITE');
        if (onDefeat) onDefeat();
      } else {
        onAutoLock();
      }
    }, remaining * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, isCurrentPlayer, onAutoLock, onDefeat]); // Attention aux dépendances circulaires avec gameState

  return timeLeft;
};
