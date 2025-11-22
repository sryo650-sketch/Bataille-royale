// src/hooks/useFriendsFirebase.ts
import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreQuery } from './useFirestoreQuery';
import { Friendship } from '../lib/firebase.types';

export const useFriendsFirebase = () => {
  const { currentUser } = useAuth();

  const friendsQuery = useMemo(() => {
    if (!currentUser) return null;

    return query(
      collection(db, 'friendships'),
      where('userId', '==', currentUser.uid),
      where('status', '==', 'accepted'),
      orderBy('friendStatus', 'desc')
    );
  }, [currentUser]);

  const { data: friendships, loading, error } = useFirestoreQuery<Friendship>(friendsQuery);

  // Transformer en format compatible avec l'UI existante
  const friends = useMemo(() => {
    return friendships.map(friendship => {
      // Convertir le status Firebase (lowercase) vers le format UI (capitalized)
      const statusMap = {
        'online': 'Online' as const,
        'offline': 'Offline' as const,
        'in_game': 'In Game' as const,
      };
      
      return {
        id: friendship.friendId,
        name: friendship.friendName,
        avatar: friendship.friendAvatar,
        countryCode: friendship.friendCountryCode,
        status: statusMap[friendship.friendStatus] || 'Offline' as const,
      };
    });
  }, [friendships]);

  return { friends, loading, error };
};
