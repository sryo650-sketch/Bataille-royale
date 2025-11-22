// src/hooks/useRecentOpponentsFirebase.ts
import { useMemo } from 'react';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreQuery } from './useFirestoreQuery';
import { Match } from '../lib/firebase.types';

export const useRecentOpponentsFirebase = (limitCount = 3) => {
  const { currentUser } = useAuth();

  const matchesQuery = useMemo(() => {
    if (!currentUser) return null;

    return query(
      collection(db, 'matches'),
      where('player1Id', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
  }, [currentUser, limitCount]);

  const { data: matches, loading, error } = useFirestoreQuery<Match>(matchesQuery);

  // Transformer en format compatible avec l'UI existante
  const recentOpponents = useMemo(() => {
    return matches.map(match => ({
      matchId: match.id,
      name: match.player2Name,
      countryCode: match.player2CountryCode,
      result: match.result,
      date: match.createdAt.toDate().toISOString(),
    }));
  }, [matches]);

  return { recentOpponents, loading, error };
};
