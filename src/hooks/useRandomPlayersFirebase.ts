// src/hooks/useRandomPlayersFirebase.ts
import { useMemo } from 'react';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreQuery } from './useFirestoreQuery';
import { UserProfile } from '../lib/firebase.types';

export const useRandomPlayersFirebase = (limitCount = 5) => {
  const { currentUser } = useAuth();

  const playersQuery = useMemo(() => {
    if (!currentUser) return null;

    // Firebase n'a pas de RANDOM(), on prend les derniers actifs
    return query(
      collection(db, 'users'),
      where('status', '==', 'online'),
      orderBy('lastSeen', 'desc'),
      limit(limitCount * 2) // Prendre plus pour filtrer l'utilisateur courant
    );
  }, [currentUser, limitCount]);

  const { data: users, loading, error } = useFirestoreQuery<UserProfile>(playersQuery);

  // Filtrer l'utilisateur courant et limiter
  const randomPlayers = useMemo(() => {
    return users
      .filter(user => user.id !== currentUser?.uid)
      .slice(0, limitCount)
      .map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        countryCode: user.countryCode,
        elo: user.elo,
        mode: 'Classic', // TODO: récupérer le mode préféré
        timeAgo: '2m ago', // TODO: calculer depuis lastSeen
      }));
  }, [users, currentUser, limitCount]);

  return { randomPlayers, loading, error };
};
