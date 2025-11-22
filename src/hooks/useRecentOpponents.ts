import { useMemo } from 'react';

type MatchHistory = {
  id: string;
  opponentName: string;
  opponentCountry: string;
  result: 'WIN' | 'LOSS';
  date: string;
};

export type RecentOpponentEntry = {
  matchId: string;
  name: string;
  countryCode: string;
  result: 'WIN' | 'LOSS';
  date: string;
};

export const useRecentOpponents = (history: MatchHistory[], limit: number = 3): RecentOpponentEntry[] => {
  return useMemo(() => {
    const seen = new Set<string>();
    const recent: RecentOpponentEntry[] = [];

    for (let i = history.length - 1; i >= 0 && recent.length < limit; i--) {
      const match = history[i];
      // Utiliser matchId au lieu de opponentName pour l'unicité
      const uniqueKey = `${match.id}-${match.opponentName}`;
      
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        recent.push({
          matchId: match.id,
          name: match.opponentName,
          countryCode: match.opponentCountry,
          result: match.result,
          date: match.date,
        });
      }
    }

    return recent;
  }, [history, limit]);
};
