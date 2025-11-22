import { useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { 
  CreateGameData, 
  GameActionData, 
  UseSpecialData,
  SpecialType 
} from '../types/game.types';

/**
 * Hook pour effectuer des actions sur une partie
 * Toutes les actions passent par des Cloud Functions qui valident côté serveur
 */
export const useGameActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Créer une nouvelle partie
   */
  const createGame = useCallback(async (data: CreateGameData): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const callable = httpsCallable<CreateGameData, { gameId: string }>(
        functions, 
        'createGame'
      );
      const result = await callable(data);
      return result.data.gameId;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create game';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Verrouiller la carte du joueur
   */
  const lockCard = useCallback(async (gameId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const callable = httpsCallable<GameActionData, { success: boolean }>(
        functions, 
        'lockCard'
      );
      await callable({ gameId });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to lock card';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Utiliser une charge spéciale (attaque ou défense)
   */
  const useSpecial = useCallback(async (gameId: string, specialType: SpecialType) => {
    setLoading(true);
    setError(null);
    
    try {
      const callable = httpsCallable<UseSpecialData, { success: boolean }>(
        functions, 
        'useSpecial'
      );
      await callable({ gameId, specialType });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to use special';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Abandonner la partie
   */
  const surrender = useCallback(async (gameId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const callable = httpsCallable<GameActionData, { success: boolean }>(
        functions, 
        'surrender'
      );
      await callable({ gameId });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to surrender';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    createGame,
    lockCard,
    useSpecial,
    surrender,
    loading,
    error,
  };
};
