# 🏗️ Architecture Backend - Server-Authoritative Game

## 🎯 Objectif

Migrer de **client-authoritative** (triche facile) vers **server-authoritative** (sécurisé).

---

## 🔴 Problèmes Actuels (Client-Only)

### Failles de Sécurité Critiques

```typescript
// ❌ ACTUEL : Le client décide de tout
const handleWin = (playerWon: boolean) => {
  recordGame(didWin ? 'WIN' : 'LOSS', ...); // ← Triche facile
};

const [playerSpecialCharges, setPlayerSpecialCharges] = useState(0);
// ← Un joueur peut faire `setPlayerSpecialCharges(999)` dans la console

rapidTimerRef.current = setInterval(() => {
  if (prev <= 1) endGame(...); // ← Timer côté client = bypass facile
}, 1000);
```

### Impact

- ✅ **Triche possible** : Modifier les victoires, charges, timers
- ✅ **Pas de matchmaking** : Impossible de garantir l'équité
- ✅ **Pas de classement** : ELO falsifiable
- ✅ **Pas de replay** : Aucune trace serveur

---

## ✅ Architecture Cible (Firebase)

### Stack Technique

- **Firestore Realtime Database** : État du jeu en temps réel
- **Cloud Functions** : Validation de chaque action
- **Security Rules** : Bloquer les écritures directes
- **Cloud Scheduler** : Timers serveur

---

## 📊 Schéma Firestore

### Collection `games`

```typescript
interface Game {
  id: string;
  mode: 'classic' | 'rapid' | 'daily';
  status: 'waiting' | 'in_progress' | 'finished';
  
  // Joueurs
  player1: {
    uid: string;
    name: string;
    deck: string[]; // IDs des cartes (pas les cartes complètes)
    currentCardIndex: number | null;
    score: number;
    specialCharges: number;
    isLocked: boolean;
    usingSpecial: 'attack' | 'defense' | null;
  };
  
  player2: {
    uid: string;
    name: string;
    deck: string[];
    currentCardIndex: number | null;
    score: number;
    specialCharges: number;
    isLocked: boolean;
    usingSpecial: 'attack' | 'defense' | null;
  };
  
  // État de la partie
  phase: 'WAITING' | 'LOCKED' | 'REVEALING' | 'RESOLVING' | 'BATTLE' | 'GAME_OVER';
  pot: string[]; // IDs des cartes dans le pot
  roundCount: number;
  
  // Timer (mode Rapid uniquement)
  startedAt: Timestamp;
  rapidTimeLeft: number | null; // Secondes restantes
  lastTimerUpdate: Timestamp;
  
  // Résultat
  winner: string | null; // UID du gagnant
  defeatReason: 'normal' | 'inactivity' | 'surrender' | null;
  
  // Métadonnées
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection `game_actions` (Log des Actions)

```typescript
interface GameAction {
  gameId: string;
  playerId: string;
  type: 'LOCK_CARD' | 'USE_SPECIAL_ATTACK' | 'USE_SPECIAL_DEFENSE' | 'SURRENDER';
  timestamp: Timestamp;
  validated: boolean; // La Cloud Function a validé ?
  error?: string; // Si refusée
}
```

---

## 🔧 Cloud Functions

### 1. `createGame` (Callable)

```typescript
// Appelée depuis le client pour créer une partie
export const createGame = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error('Unauthorized');
  
  const { mode, opponentId } = data;
  
  // Créer le deck et le mélanger côté serveur
  const fullDeck = shuffleDeck(createDeck());
  const [p1Deck, p2Deck] = splitDeck(fullDeck);
  
  const gameRef = await db.collection('games').add({
    mode,
    status: 'waiting',
    player1: {
      uid: context.auth.uid,
      deck: p1Deck.map(c => c.id),
      currentCardIndex: 0,
      score: 0,
      specialCharges: mode === 'rapid' ? 3 : 0,
      isLocked: false,
      usingSpecial: null,
    },
    player2: {
      uid: opponentId || 'bot',
      deck: p2Deck.map(c => c.id),
      currentCardIndex: 0,
      score: 0,
      specialCharges: 0,
      isLocked: false,
      usingSpecial: null,
    },
    phase: 'WAITING',
    pot: [],
    roundCount: 0,
    startedAt: FieldValue.serverTimestamp(),
    rapidTimeLeft: mode === 'rapid' ? 90 : null,
    lastTimerUpdate: FieldValue.serverTimestamp(),
    winner: null,
    defeatReason: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  return { gameId: gameRef.id };
});
```

### 2. `lockCard` (Callable)

```typescript
export const lockCard = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error('Unauthorized');
  
  const { gameId } = data;
  const gameRef = db.collection('games').doc(gameId);
  const game = await gameRef.get();
  
  if (!game.exists) throw new Error('Game not found');
  
  const gameData = game.data() as Game;
  const isPlayer1 = gameData.player1.uid === context.auth.uid;
  const player = isPlayer1 ? gameData.player1 : gameData.player2;
  
  // ✅ VALIDATION SERVEUR
  if (player.isLocked) throw new Error('Already locked');
  if (gameData.phase !== 'WAITING') throw new Error('Invalid phase');
  
  // Mettre à jour le joueur
  await gameRef.update({
    [`${isPlayer1 ? 'player1' : 'player2'}.isLocked`]: true,
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  // Si les deux joueurs ont lock, résoudre le round
  const opponent = isPlayer1 ? gameData.player2 : gameData.player1;
  if (opponent.isLocked) {
    await resolveRound(gameRef, gameData);
  }
  
  return { success: true };
});
```

### 3. `useSpecialAttack` (Callable)

```typescript
export const useSpecialAttack = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error('Unauthorized');
  
  const { gameId } = data;
  const gameRef = db.collection('games').doc(gameId);
  const game = await gameRef.get();
  const gameData = game.data() as Game;
  
  const isPlayer1 = gameData.player1.uid === context.auth.uid;
  const player = isPlayer1 ? gameData.player1 : gameData.player2;
  
  // ✅ VALIDATION SERVEUR
  if (player.specialCharges <= 0) throw new Error('No charges available');
  if (player.isLocked) throw new Error('Already locked');
  
  await gameRef.update({
    [`${isPlayer1 ? 'player1' : 'player2'}.usingSpecial`]: 'attack',
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  return { success: true };
});
```

### 4. `resolveRound` (Interne)

```typescript
async function resolveRound(gameRef: DocumentReference, game: Game) {
  const p1Card = getCardById(game.player1.deck[game.player1.currentCardIndex]);
  const p2Card = getCardById(game.player2.deck[game.player2.currentCardIndex]);
  
  // Appliquer les charges spéciales
  let p1Rank = p1Card.rank;
  let p2Rank = p2Card.rank;
  
  if (game.player1.usingSpecial === 'attack') {
    p1Rank += 3;
    game.player1.specialCharges -= 1;
  }
  if (game.player2.usingSpecial === 'defense') {
    p2Rank += 2;
    game.player2.specialCharges -= 1;
  }
  
  // Déterminer le gagnant
  let winner: 'player1' | 'player2' | 'war';
  if (p1Rank > p2Rank) winner = 'player1';
  else if (p2Rank > p1Rank) winner = 'player2';
  else winner = 'war';
  
  // Mettre à jour le deck
  if (winner === 'player1') {
    game.player1.deck.push(...game.pot, p1Card.id, p2Card.id);
    game.player2.deck.shift();
  } else if (winner === 'player2') {
    game.player2.deck.push(...game.pot, p1Card.id, p2Card.id);
    game.player1.deck.shift();
  } else {
    game.pot.push(p1Card.id, p2Card.id);
  }
  
  // Vérifier fin de partie
  if (game.player1.deck.length === 0 || game.player2.deck.length === 0) {
    await gameRef.update({
      phase: 'GAME_OVER',
      winner: game.player1.deck.length > 0 ? game.player1.uid : game.player2.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Enregistrer les stats
    await recordGameStats(game);
  } else {
    // Préparer le prochain round
    await gameRef.update({
      player1: game.player1,
      player2: game.player2,
      pot: game.pot,
      phase: 'WAITING',
      roundCount: game.roundCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
```

### 5. `updateRapidTimer` (Scheduled - Chaque Seconde)

```typescript
export const updateRapidTimer = functions.pubsub
  .schedule('every 1 seconds')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    
    // Récupérer toutes les parties en mode Rapid actives
    const gamesSnapshot = await db.collection('games')
      .where('mode', '==', 'rapid')
      .where('status', '==', 'in_progress')
      .where('rapidTimeLeft', '>', 0)
      .get();
    
    const batch = db.batch();
    
    gamesSnapshot.forEach(doc => {
      const game = doc.data() as Game;
      const elapsed = now.seconds - game.lastTimerUpdate.seconds;
      const newTimeLeft = Math.max(0, game.rapidTimeLeft - elapsed);
      
      if (newTimeLeft === 0) {
        // Temps écoulé : terminer la partie
        const winner = game.player1.deck.length > game.player2.deck.length 
          ? game.player1.uid 
          : game.player2.uid;
        
        batch.update(doc.ref, {
          phase: 'GAME_OVER',
          rapidTimeLeft: 0,
          winner,
          defeatReason: 'inactivity',
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // Mettre à jour le timer
        batch.update(doc.ref, {
          rapidTimeLeft: newTimeLeft,
          lastTimerUpdate: now,
        });
      }
    });
    
    await batch.commit();
  });
```

---

## 🔒 Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Collection games
    match /games/{gameId} {
      // Lecture : Seulement les joueurs de la partie
      allow read: if request.auth != null && (
        resource.data.player1.uid == request.auth.uid ||
        resource.data.player2.uid == request.auth.uid
      );
      
      // ❌ ÉCRITURE INTERDITE : Seulement via Cloud Functions
      allow write: if false;
    }
    
    // Collection game_actions (logs)
    match /game_actions/{actionId} {
      allow read: if request.auth != null && 
        resource.data.playerId == request.auth.uid;
      
      // ❌ ÉCRITURE INTERDITE
      allow write: if false;
    }
  }
}
```

---

## 🎮 Client-Side Hook

### `useGameRealtime.ts`

```typescript
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useGameRealtime = (gameId: string) => {
  const [gameState, setGameState] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!gameId) return;
    
    const unsubscribe = onSnapshot(
      doc(db, 'games', gameId),
      (snapshot) => {
        if (snapshot.exists()) {
          setGameState(snapshot.data() as Game);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Game listener error:', error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [gameId]);
  
  return { gameState, loading };
};
```

### `useGameActions.ts`

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export const useGameActions = (gameId: string) => {
  const lockCard = async () => {
    const callable = httpsCallable(functions, 'lockCard');
    await callable({ gameId });
  };
  
  const useSpecialAttack = async () => {
    const callable = httpsCallable(functions, 'useSpecialAttack');
    await callable({ gameId });
  };
  
  const useSpecialDefense = async () => {
    const callable = httpsCallable(functions, 'useSpecialDefense');
    await callable({ gameId });
  };
  
  const surrender = async () => {
    const callable = httpsCallable(functions, 'surrender');
    await callable({ gameId });
  };
  
  return { lockCard, useSpecialAttack, useSpecialDefense, surrender };
};
```

---

## 🚀 Migration GameScreen

### Avant (Client-Authoritative)

```typescript
// ❌ Le client décide de tout
const handlePlayerLock = () => {
  setPlayer({ ...player, isLocked: true });
  // Résoudre le round côté client
  resolveRound();
};
```

### Après (Server-Authoritative)

```typescript
// ✅ Le client demande au serveur
const handlePlayerLock = async () => {
  try {
    await lockCard(); // Cloud Function valide et met à jour Firestore
    // Le listener onSnapshot recevra l'état mis à jour
  } catch (error) {
    alert('Action invalide : ' + error.message);
  }
};
```

---

## 📊 Comparaison Avant/Après

| Aspect | Avant (Client) | Après (Serveur) |
|--------|----------------|-----------------|
| **Triche** | Facile | Impossible |
| **Timer** | Bypassable | Sécurisé |
| **Charges** | Modifiables | Validées |
| **Replay** | Impossible | Logs complets |
| **Matchmaking** | Impossible | Possible |
| **Classement** | Falsifiable | Fiable |
| **Latence** | 0ms | 50-200ms |

---

## 🎯 Prochaines Étapes

1. ✅ **Corriger bugs immédiats** (memory leaks, timers)
2. ⏳ **Créer Cloud Functions** (createGame, lockCard, useSpecial)
3. ⏳ **Implémenter hooks Realtime** (useGameRealtime, useGameActions)
4. ⏳ **Migrer GameScreen** vers architecture server-authoritative
5. ⏳ **Ajouter Security Rules** strictes
6. ⏳ **Tester latence** et optimiser

---

## 💡 Notes Importantes

- **Latence** : Firestore Realtime = 50-200ms (acceptable pour un jeu de cartes au tour par tour)
- **Coût** : Firebase Functions = ~$0.40 pour 1 million d'appels (très abordable)
- **Scalabilité** : Firestore scale automatiquement jusqu'à des millions de parties simultanées

---

**Cette architecture garantit un jeu équitable et sécurisé.** 🔒🎮
