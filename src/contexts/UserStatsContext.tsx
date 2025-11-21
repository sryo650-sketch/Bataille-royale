import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectUserCountry } from '../utils/countryUtils';
import { getUserData } from '../utils/onboardingUtils';

export interface MatchRecord {
  id: string;
  opponentName: string;
  opponentCountry: string;
  result: 'WIN' | 'LOSS';
  scoreChange: number;
  date: string;
  cardsWon: number;
}

export interface UserStats {
  elo: number;
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  totalCardsWon: number;
  totalChargesEarned: number;
  history: MatchRecord[];
  countryCode: string;
  gamesPlayed: number;
  avatar?: string;
  playerName: string;
}

type UpdateProfilePayload = {
  playerName?: string;
  countryCode?: string;
  avatar?: string;
  totalChargesEarned?: number;
};

interface UserStatsContextType {
  stats: UserStats;
  recordGame: (result: 'WIN' | 'LOSS', opponentName: string, opponentCountry: string) => void;
  updateProfile: (profile: UpdateProfilePayload) => void;
}

const defaultStats: UserStats = {
  elo: 1000,
  wins: 0,
  losses: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalCardsWon: 0,
  totalChargesEarned: 0,
  history: [],
  countryCode: 'FR',
  gamesPlayed: 0,
  avatar: undefined,
  playerName: 'Capitaine',
};

const STORAGE_KEY = 'royal_battles_stats';

const UserStatsContext = createContext<UserStatsContextType | undefined>(undefined);

export const UserStatsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>(defaultStats);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        // Charger les données d'onboarding en priorité
        const onboardingData = await getUserData();
        
        // Charger les stats du jeu
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && isMounted) {
          const parsed = JSON.parse(saved);
          setStats(prev => ({
            ...prev,
            ...parsed,
            // Utiliser les données d'onboarding si disponibles
            playerName: onboardingData?.username ?? parsed.playerName ?? prev.playerName,
            countryCode: onboardingData?.countryCode ?? parsed.countryCode ?? prev.countryCode,
            avatar: onboardingData?.avatar ?? parsed.avatar ?? prev.avatar,
          }));
        } else if (isMounted) {
          // Pas de stats sauvegardées, utiliser onboarding + détection pays
          setStats(prev => ({
            ...prev,
            playerName: onboardingData?.username ?? prev.playerName,
            countryCode: onboardingData?.countryCode ?? detectUserCountry(),
            avatar: onboardingData?.avatar ?? prev.avatar,
          }));
        }
      } catch {
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      } catch {
      }
    };
    save();
  }, [stats]);

  const recordGame = (result: 'WIN' | 'LOSS', opponentName: string, opponentCountry: string) => {
    const scoreChange = result === 'WIN' ? 52 : -26;
    const cardsWon = result === 'WIN' ? 52 : 0;
    const newMatch: MatchRecord = {
      id: Date.now().toString(),
      opponentName,
      opponentCountry,
      result,
      scoreChange,
      cardsWon,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setStats(prev => {
      const newStreak = result === 'WIN' ? prev.currentStreak + 1 : 0;
      const newElo = Math.max(0, prev.elo + scoreChange);
      return {
        ...prev,
        elo: newElo,
        wins: prev.wins + (result === 'WIN' ? 1 : 0),
        losses: prev.losses + (result === 'LOSS' ? 1 : 0),
        gamesPlayed: prev.gamesPlayed + 1,
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        totalCardsWon: prev.totalCardsWon + cardsWon,
        history: [newMatch, ...prev.history].slice(0, 20),
      };
    });
  };

  const updateProfile = ({ playerName, countryCode, avatar }: UpdateProfilePayload) => {
    setStats(prev => ({
      ...prev,
      playerName: playerName ?? prev.playerName,
      countryCode: countryCode ?? prev.countryCode,
      avatar: avatar !== undefined ? avatar : prev.avatar,
    }));
  };

  return (
    <UserStatsContext.Provider value={{ stats, recordGame, updateProfile }}>
      {children}
    </UserStatsContext.Provider>
  );
};

export const useUserStats = () => {
  const context = useContext(UserStatsContext);
  if (!context) {
    throw new Error('useUserStats must be used within a UserStatsProvider');
  }
  return context;
};
