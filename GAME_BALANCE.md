# ⚖️ Équilibrage du Jeu - Configuration Centralisée

## 📍 Fichier de Configuration

**Emplacement :** `functions/src/gameConfig.ts`

Toutes les valeurs d'équilibrage sont centralisées dans ce fichier pour faciliter les ajustements.

---

## 🎮 Paramètres Actuels

### ⏱️ Timers

```typescript
RAPID_MODE_DURATION: 180  // 3 minutes (en secondes)
ROUND_TIMEOUT: 30         // Temps max par round (optionnel)
```

**Modifier :** Changez `180` pour ajuster la durée du mode Rapid.

---

### ⚡ Charges Spéciales

```typescript
ATTACK_BONUS: 5           // Bonus de la charge Attack
DEFENSE_BONUS: 3          // Bonus de la charge Defense
MAX_CHARGES: 3            // Maximum de charges stockables
CHARGE_UNLOCK_INTERVAL: 10 // Gagner une charge tous les X rounds
```

**Exemples d'ajustements :**
- Rendre Attack plus puissant : `ATTACK_BONUS: 7`
- Charges plus fréquentes : `CHARGE_UNLOCK_INTERVAL: 5`
- Plus de charges : `MAX_CHARGES: 5`

---

### 🎯 Modes de Jeu

```typescript
RAPID_STARTING_CHARGES: 3  // Charges au début en mode Rapid
CLASSIC_STARTING_CHARGES: 0 // Charges au début en mode Classic
```

**Exemples :**
- Rapid plus intense : `RAPID_STARTING_CHARGES: 5`
- Classic avec charges : `CLASSIC_STARTING_CHARGES: 1`

---

### 🏆 Conditions de Défaite

```typescript
DEFEAT_CONDITIONS: {
  RAPID_TIMEOUT_ENABLED: true,    // Défaite si timer écoulé
  INACTIVITY_TIMEOUT: 60,         // Défaite après 60s d'inactivité (0 = désactivé)
  SURRENDER_ENABLED: true,        // Permettre l'abandon
  NO_CARDS_DEFEAT: true,          // Défaite si plus de cartes
}
```

**Exemples :**
- Désactiver timeout : `RAPID_TIMEOUT_ENABLED: false`
- Inactivité plus stricte : `INACTIVITY_TIMEOUT: 30`
- Pas d'abandon : `SURRENDER_ENABLED: false`

---

### 🎲 Détermination du Gagnant

```typescript
WINNER_DETERMINATION: {
  RAPID_TIMEOUT: 'cards',  // 'cards' | 'score' | 'draw'
  TIE_BREAKER: 'player1',  // 'player1' | 'player2' | 'random' | 'draw'
}
```

**Options :**

#### `RAPID_TIMEOUT`
- **`'cards'`** : Celui avec le plus de cartes gagne
- **`'score'`** : Celui avec le plus de rounds gagnés
- **`'draw'`** : Match nul si égalité

#### `TIE_BREAKER` (en cas d'égalité parfaite)
- **`'player1'`** : Avantage au joueur 1
- **`'player2'`** : Avantage au joueur 2
- **`'random'`** : Tirage au sort
- **`'draw'`** : Match nul

---

## 🔄 Comment Modifier l'Équilibrage

### 1. Éditer le Fichier

```bash
# Ouvrir le fichier
code functions/src/gameConfig.ts
```

### 2. Modifier les Valeurs

```typescript
// Exemple : Rendre le jeu plus rapide et intense
export const GAME_CONFIG = {
  RAPID_MODE_DURATION: 120,      // 2 minutes au lieu de 3
  ATTACK_BONUS: 7,               // +7 au lieu de +5
  DEFENSE_BONUS: 4,              // +4 au lieu de +3
  CHARGE_UNLOCK_INTERVAL: 5,     // Tous les 5 rounds au lieu de 10
  MAX_CHARGES: 5,                // 5 charges max au lieu de 3
  RAPID_STARTING_CHARGES: 5,     // Commencer avec 5 charges
};
```

### 3. Recompiler et Déployer

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 4. Tester

Les changements sont appliqués immédiatement pour les **nouvelles parties**.

---

## 📊 Scénarios d'Équilibrage

### Scénario 1 : Jeu Plus Rapide

```typescript
RAPID_MODE_DURATION: 90,        // 1.5 minutes
CHARGE_UNLOCK_INTERVAL: 5,      // Charges plus fréquentes
ATTACK_BONUS: 7,                // Attaques plus puissantes
```

**Effet :** Parties courtes et intenses.

---

### Scénario 2 : Jeu Plus Stratégique

```typescript
RAPID_MODE_DURATION: 300,       // 5 minutes
CHARGE_UNLOCK_INTERVAL: 15,     // Charges rares
ATTACK_BONUS: 3,                // Bonus modérés
DEFENSE_BONUS: 2,
MAX_CHARGES: 2,                 // Peu de charges
```

**Effet :** Parties longues, charges précieuses.

---

### Scénario 3 : Mode Chaos

```typescript
RAPID_STARTING_CHARGES: 10,     // Beaucoup de charges
ATTACK_BONUS: 10,               // Bonus énormes
DEFENSE_BONUS: 8,
CHARGE_UNLOCK_INTERVAL: 3,      // Charges très fréquentes
```

**Effet :** Parties imprévisibles et explosives.

---

### Scénario 4 : Mode Compétitif

```typescript
RAPID_MODE_DURATION: 180,
ATTACK_BONUS: 4,                // Bonus équilibrés
DEFENSE_BONUS: 3,
WINNER_DETERMINATION: {
  RAPID_TIMEOUT: 'score',       // Gagnant par rounds gagnés
  TIE_BREAKER: 'random',        // Tirage au sort si égalité
}
```

**Effet :** Équilibré pour l'esport.

---

## 🧪 Tests Recommandés

Après chaque modification :

1. **Créer une partie** avec les nouveaux paramètres
2. **Jouer plusieurs rounds** pour tester les charges
3. **Vérifier les bonus** dans les logs Firebase
4. **Tester le timeout** (si modifié)
5. **Valider l'équilibre** avec plusieurs parties

---

## 📝 Historique des Changements

### Version 1.0 (Actuelle)
- Attack : +5
- Defense : +3
- Rapid : 180s
- Charges : Tous les 10 rounds
- Max charges : 3

### Modifications Futures

Documentez vos changements ici :

```
[Date] - [Votre Nom]
- Attack : +5 → +7
- Raison : Rendre les charges plus impactantes
- Résultat : Parties plus dynamiques
```

---

## 💡 Conseils d'Équilibrage

### 1. Changez Une Valeur à la Fois
Ne modifiez pas tout en même temps, testez chaque changement.

### 2. Testez avec Différents Joueurs
L'équilibre peut varier selon le niveau des joueurs.

### 3. Écoutez les Retours
Les joueurs sont la meilleure source de feedback.

### 4. Gardez des Sauvegardes
Notez les anciennes valeurs avant de les changer.

---

## 🎯 Valeurs Recommandées par Mode

### Mode Casual (Débutants)
```typescript
ATTACK_BONUS: 6
DEFENSE_BONUS: 4
CHARGE_UNLOCK_INTERVAL: 5
RAPID_MODE_DURATION: 240  // 4 minutes
```

### Mode Normal (Équilibré)
```typescript
ATTACK_BONUS: 5
DEFENSE_BONUS: 3
CHARGE_UNLOCK_INTERVAL: 10
RAPID_MODE_DURATION: 180  // 3 minutes
```

### Mode Compétitif (Experts)
```typescript
ATTACK_BONUS: 4
DEFENSE_BONUS: 2
CHARGE_UNLOCK_INTERVAL: 15
RAPID_MODE_DURATION: 120  // 2 minutes
```

---

**Tous les paramètres sont maintenant centralisés et faciles à modifier !** ⚖️✨
