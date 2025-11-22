# 🔥 Cloud Functions - Server-Authoritative Game

## 📦 Installation

```bash
cd functions
npm install
```

## 🚀 Déploiement

```bash
# Déployer toutes les fonctions
firebase deploy --only functions

# Déployer une fonction spécifique
firebase deploy --only functions:createGame
```

## 🧪 Test Local

```bash
# Démarrer l'émulateur
firebase emulators:start

# L'émulateur sera disponible sur http://localhost:5001
```

## 📋 Fonctions Disponibles

### 1. `createGame` (Callable)

Créer une nouvelle partie.

**Input:**
```typescript
{
  mode: 'classic' | 'rapid' | 'daily',
  opponentId?: string // Si null, jouer contre un bot
}
```

**Output:**
```typescript
{
  gameId: string
}
```

**Exemple:**
```typescript
const callable = httpsCallable(functions, 'createGame');
const result = await callable({ mode: 'rapid' });
console.log(result.data.gameId); // "abc123"
```

---

### 2. `lockCard` (Callable)

Verrouiller la carte du joueur pour le round actuel.

**Input:**
```typescript
{
  gameId: string
}
```

**Output:**
```typescript
{
  success: boolean
}
```

**Validations:**
- Le joueur n'a pas déjà lock
- La phase est `WAITING`
- Le joueur fait partie de la partie

---

### 3. `useSpecial` (Callable)

Utiliser une charge spéciale (attaque ou défense).

**Input:**
```typescript
{
  gameId: string,
  specialType: 'attack' | 'defense'
}
```

**Output:**
```typescript
{
  success: boolean
}
```

**Validations:**
- Le joueur a des charges disponibles
- Le joueur n'a pas déjà lock
- Le joueur fait partie de la partie

---

### 4. `surrender` (Callable)

Abandonner la partie.

**Input:**
```typescript
{
  gameId: string
}
```

**Output:**
```typescript
{
  success: boolean
}
```

---

### 5. `updateRapidTimer` (Scheduled)

Mise à jour automatique du timer en mode Rapid.

**Déclenchement:** Chaque seconde (Cloud Scheduler)

**Actions:**
- Décrémente `rapidTimeLeft` pour toutes les parties actives
- Termine les parties quand le timer atteint 0
- Détermine le gagnant par nombre de cartes

---

## 🔒 Sécurité

### Authentification

Toutes les fonctions **Callable** vérifient l'authentification :

```typescript
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
}
```

### Validation des Actions

Chaque action est validée côté serveur :

```typescript
// ✅ Vérifier que le joueur fait partie de la partie
const isPlayer1 = gameData.player1.uid === context.auth.uid;
const isPlayer2 = gameData.player2.uid === context.auth.uid;

if (!isPlayer1 && !isPlayer2) {
  throw new functions.https.HttpsError('permission-denied', 'Not a player in this game');
}

// ✅ Vérifier que l'action est valide
if (player.isLocked) {
  throw new functions.https.HttpsError('failed-precondition', 'Already locked');
}
```

---

## 📊 Structure des Données

### Collection `games`

```typescript
{
  id: string,
  mode: 'classic' | 'rapid' | 'daily',
  status: 'waiting' | 'in_progress' | 'finished',
  
  player1: {
    uid: string,
    name: string,
    deck: string[], // IDs des cartes
    currentCardIndex: number,
    score: number,
    specialCharges: number,
    isLocked: boolean,
    usingSpecial: 'attack' | 'defense' | null
  },
  
  player2: { /* same structure */ },
  
  phase: 'WAITING' | 'LOCKED' | 'REVEALING' | 'RESOLVING' | 'BATTLE' | 'GAME_OVER',
  pot: string[],
  roundCount: number,
  
  // Timer (mode Rapid)
  startedAt: Timestamp,
  rapidTimeLeft: number | null,
  lastTimerUpdate: Timestamp,
  
  // Résultat
  winner: string | null,
  defeatReason: 'normal' | 'inactivity' | 'surrender' | null,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🧪 Tests

```bash
# Installer les dépendances de test
npm install --save-dev @types/jest jest ts-jest

# Lancer les tests
npm test
```

**Exemple de test:**

```typescript
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('createGame', () => {
  it('should create a game with valid data', async () => {
    const data = { mode: 'rapid' };
    const context = { auth: { uid: 'user123' } };
    
    const result = await createGame(data, context);
    
    expect(result.gameId).toBeDefined();
  });
});
```

---

## 📈 Monitoring

### Firebase Console

- **Logs:** https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs
- **Usage:** https://console.firebase.google.com/project/YOUR_PROJECT/functions/usage
- **Errors:** Alertes automatiques par email

### Métriques Importantes

- **Invocations:** Nombre d'appels par fonction
- **Latence:** Temps d'exécution moyen
- **Erreurs:** Taux d'échec
- **Coût:** Estimation mensuelle

---

## 💰 Coûts Estimés

| Fonction | Appels/Jour | Coût/Mois |
|----------|-------------|-----------|
| createGame | 1,000 | $0.40 |
| lockCard | 10,000 | $4.00 |
| useSpecial | 2,000 | $0.80 |
| surrender | 100 | $0.04 |
| updateRapidTimer | 86,400 | $34.56 |
| **TOTAL** | | **~$40/mois** |

**Note:** Les 2 millions premiers appels sont gratuits chaque mois.

---

## 🚀 Optimisations

### 1. Batch Updates

Grouper les mises à jour Firestore :

```typescript
const batch = db.batch();
batch.update(gameRef, { phase: 'RESOLVING' });
batch.update(player1Ref, { score: newScore });
await batch.commit();
```

### 2. Caching

Utiliser des variables globales pour les données statiques :

```typescript
let deckTemplate: CardData[] | null = null;

export const createGame = async () => {
  if (!deckTemplate) {
    deckTemplate = createDeck(); // Cache
  }
  const shuffled = shuffleDeck([...deckTemplate]);
};
```

### 3. Indexes

Créer des indexes composites pour les requêtes complexes (voir `firestore.indexes.json`).

---

## 🐛 Debugging

### Logs

```typescript
import * as functions from 'firebase-functions';

functions.logger.info('Game created', { gameId, mode });
functions.logger.error('Failed to resolve round', { error });
```

### Émulateur Local

```bash
firebase emulators:start --only functions,firestore
```

Accéder à l'UI : http://localhost:4000

---

## 📚 Ressources

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Callable Functions](https://firebase.google.com/docs/functions/callable)
- [Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
- [Best Practices](https://firebase.google.com/docs/functions/best-practices)

---

**Les Cloud Functions garantissent un jeu équitable et sécurisé !** 🔒🎮
