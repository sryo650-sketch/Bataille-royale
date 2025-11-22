import { useCallback } from 'react';
import { GameConfig, GameMode, NavigationHandler, Screen } from '../types';
import { UI_CONSTANTS } from '../constants';

export const useGameNavigation = (onNavigate: NavigationHandler) => {
  const handlePlay = useCallback((mode: GameMode) => {
    const config: GameConfig = { mode };
    onNavigate(Screen.GAME, { gameConfig: config });
  }, [onNavigate]);

  const handleChallenge = useCallback((name: string, countryCode?: string, avatar?: string) => {
    const config: GameConfig = {
      mode: 'classic',
      opponent: {
        id: `challenge-${name}-${Date.now()}`,
        name,
        countryCode: countryCode ?? UI_CONSTANTS.DEFAULT_COUNTRY,
        avatar,
      },
    };
    onNavigate(Screen.GAME, { gameConfig: config });
  }, [onNavigate]);

  const handleDuel = useCallback((name: string, countryCode?: string, avatar?: string) => {
    const config: GameConfig = {
      mode: 'rapid',
      opponent: {
        id: `duel-${name}-${Date.now()}`,
        name,
        countryCode: countryCode ?? UI_CONSTANTS.DEFAULT_COUNTRY,
        avatar,
      },
    };
    onNavigate(Screen.GAME, { gameConfig: config });
  }, [onNavigate]);

  return { handlePlay, handleChallenge, handleDuel };
};
