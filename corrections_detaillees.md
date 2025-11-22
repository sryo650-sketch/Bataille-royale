# Corrections Détaillées du Jeu de Bataille

## 🚨 Corrections Critiques (Priorité 1)

### 1. Logique d'affichage des cartes

**Problème**: Les cartes sont visibles pendant la sélection, trahissant les règles du jeu.

**Fichier**: `NewGameScreen.tsx`
**Lignes**: 140-150 (approximativement)

**Code actuel (INCORRECT)**:
```javascript
<Card
  card={opponent?.deck?.[0] ? getCardById(opponent.deck[0]) : undefined}
  isFaceUp={!(currentPlayer.isLocked && (opponent?.isLocked ?? false))}
  size="md"
/>
```

**Code corrigé**:
```javascript
<Card
  card={opponent?.deck?.[0] ? getCardById(opponent.deck[0]) : undefined}
  isFaceUp={currentPlayer.isLocked && (opponent?.isLocked ?? false)}
  size="md"
/>
```

**Logique**: Les cartes ne doivent être révélées que lorsque LES DEUX joueurs ont verrouillé leur choix.

### 2. Validation des cartes spéciales

**Problème**: Pas de vérification du nombre de charges disponibles.

**Fichier**: `NewGameScreen.tsx`
**Lignes**: 70-80 (handleUseSpecial)

**Code actuel**:
```javascript
const handleUseSpecial = useCallback(async (type: 'attack' | 'defense') => {
  if (!gameId || actionLoading) return;
  try {
    setError(null);
    await useSpecial(gameId, type);
  } catch (err) {
    setError((err as Error).message);
  }
}, [gameId, actionLoading, useSpecial, setError]);
```

**Code corrigé**:
```javascript
const handleUseSpecial = useCallback(async (type: 'attack' | 'defense') => {
  if (!gameId || actionLoading || currentPlayer.specialCharges <= 0) return;
  try {
    setError(null);
    await useSpecial(gameId, type);
  } catch (err) {
    setError((err as Error).message);
  }
}, [gameId, actionLoading, currentPlayer.specialCharges, useSpecial]);
```

### 3. Dépendances incomplètes dans useCallback

**Problème**: Les dépendances ne sont pas complètes, risquant des comportements imprévisibles.

**Fichier**: `NewGameScreen.tsx`
**Multiple endroits**

**Correction générale**:
```javascript
// Toujours inclure toutes les dépendances utilisées dans le callback
const handleLockCard = useCallback(async () => {
  if (!gameId || actionLoading) return;
  try {
    setError(null);
    await lockCard(gameId);
  } catch (err) {
    setError((err as Error).message);
  }
}, [gameId, actionLoading, lockCard]); // setError retiré car stable
```

## 🔒 Améliorations de Sécurité (Priorité 2)

### 4. Confirmation pour l'abandon

**Fichier**: `NewGameScreen.tsx`
**Méthode**: `handleSurrender`

**Code corrigé**:
```javascript
const handleSurrender = useCallback(async () => {
  if (!gameId || actionLoading) return;
  
  // Demander confirmation
  Alert.alert(
    "Abandonner",
    "Êtes-vous sûr de vouloir abandonner la partie ?",
    [
      { text: "Annuler", style: "cancel" },
      { text: "Abandonner", style: "destructive", onPress: async () => {
        try {
          setError(null);
          await surrender(gameId);
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    ]
  );
}, [gameId, actionLoading, surrender]);
```

### 5. Gestion améliorée des erreurs

**Code à ajouter**:
```javascript
// Fonction utilitaire pour la gestion d'erreurs
const handleError = (error: Error, context: string) => {
  console.error(`Erreur dans ${context}:`, error);
  
  // Messages d'erreur génériques pour la sécurité
  const userMessage = context === 'network' 
    ? 'Erreur de connexion. Vérifiez votre réseau.'
    : 'Une erreur est survenue. Veuillez réessayer.';
    
  setError(userMessage);
};
```

### 6. Rate limiting pour les actions

**Code à ajouter**:
```javascript
// État pour le rate limiting
const [lastActionTime, setLastActionTime] = useState<number>(0);
const ACTION_COOLDOWN = 1000; // 1 seconde

const canPerformAction = () => {
  const now = Date.now();
  if (now - lastActionTime < ACTION_COOLDOWN) {
    return false;
  }
  setLastActionTime(now);
  return true;
};

// Utiliser dans les handlers
const handleLockCard = useCallback(async () => {
  if (!gameId || actionLoading || !canPerformAction()) return;
  // ... reste du code
}, [gameId, actionLoading, lockCard, lastActionTime]);
```

## 🐛 Corrections de Bugs (Priorité 3)

### 7. Gestion de l'expiration du timer rapide

**Code à ajouter**:
```javascript
useEffect(() => {
  if (rapidTimeLeft === 0 && gameState?.phase === 'WAITING' && !currentPlayer.isLocked) {
    // Timer expiré, verrouiller automatiquement
    handleAutoLock();
  }
}, [rapidTimeLeft, gameState?.phase, currentPlayer?.isLocked, handleAutoLock]);
```

### 8. Vérification de fin de partie automatique

**Code à ajouter**:
```javascript
useEffect(() => {
  if (gameState && currentPlayer && opponent) {
    // Vérifier si un joueur n'a plus de cartes
    if (currentPlayer.deck?.length === 0 || opponent.deck?.length === 0) {
      // Logique pour déclencher la fin de partie
      console.log('Fin de partie détectée - plus de cartes');
    }
    
    // Vérifier si un joueur a toutes les cartes (victoire)
    const totalCards = (currentPlayer.deck?.length || 0) + (opponent.deck?.length || 0);
    if (totalCards > 0 && (currentPlayer.deck?.length === totalCards || opponent.deck?.length === totalCards)) {
      // Déclencher la fin de partie
    }
  }
}, [gameState, currentPlayer, opponent]);
```

### 9. Amélioration de l'affichage des informations

**Code à ajouter dans la section d'infos**:
```javascript
{currentPlayer.specialCharges === 0 && (
  <Text style={[styles.text, styles.warningText]}>
    ⚡ Aucune charge spéciale disponible
  </Text>
)}

{currentPlayer.deck?.length <= 5 && (
  <Text style={[styles.text, styles.warningText]}>
    ⚠️ Attention: Plus que {currentPlayer.deck?.length} cartes restantes
  </Text>
)}
```

### 10. Nettoyage des effets

**Code à ajouter pour éviter les memory leaks**:
```javascript
useEffect(() => {
  let isMounted = true;
  
  // Logique de l'effet
  
  return () => {
    isMounted = false;
    // Nettoyage si nécessaire
  };
}, [dependencies]);
```

## 🎨 Améliorations UI/UX (Priorité 4)

### 11. Styles pour les avertissements

**Code CSS à ajouter**:
```javascript
warningText: {
  color: '#f59e0b',
  fontWeight: 'bold',
},

infoText: {
  color: '#3b82f6',
  fontSize: 14,
},

successText: {
  color: '#10b981',
  fontWeight: 'bold',
},
```

### 12. Feedback visuel amélioré

**Code pour les indicateurs visuels**:
```javascript
{selectedSpecial && (
  <View style={styles.specialIndicator}>
    <Text style={styles.specialText}>
      {selectedSpecial === 'attack' ? '⚔️ Attack activé (+5)' : '🛡️ Defense activé (+3)'}
    </Text>
  </View>
)}

// Style
specialIndicator: {
  backgroundColor: '#7c3aed',
  padding: 8,
  borderRadius: 6,
  marginTop: 8,
  borderWidth: 2,
  borderColor: '#a855f7',
},
specialText: {
  color: '#fbbf24',
  fontWeight: 'bold',
  textAlign: 'center',
},
```

## 🧪 Tests Recommandés

### Tests unitaires à implémenter:
```javascript
describe('Battle Game Logic', () => {
  test('Cards should be hidden when not both locked', () => {
    // Test de la logique d'affichage
  });
  
  test('Special cards should require charges', () => {
    // Test de la validation des charges
  });
  
  test('Game should end when player has no cards', () => {
    // Test de la fin de partie
  });
  
  test('Actions should have cooldown', () => {
    // Test du rate limiting
  });
});
```

## 📋 Checklist de Déploiement

- [ ] Corriger la logique d'affichage des cartes
- [ ] Ajouter la validation des cartes spéciales
- [ ] Corriger les dépendances useCallback
- [ ] Ajouter la confirmation d'abandon
- [ ] Implémenter le rate limiting
- [ ] Ajouter la gestion du timer rapide
- [ ] Vérifier la fin de partie automatique
- [ ] Améliorer l'affichage des informations
- [ ] Ajouter le nettoyage des effets
- [ ] Tester toutes les fonctionnalités
- [ ] Déployer en staging
- [ ] Effectuer des tests utilisateur
- [ ] Déployer en production

## 📝 Notes Importantes

1. **Toujours tester en mode développement avant de déployer**
2. **Sauvegarder l'état actuel du code avant de faire les corrections**
3. **Faire les corrections une par une pour faciliter le débogage**
4. **Documenter chaque changement dans les commit messages**
5. **Vérifier la compatibilité avec le backend après chaque correction**