# 🌱 Script de Seed Firestore

Ce script crée automatiquement des données de test dans Firebase.

## 📦 Ce qui est Créé

### 5 Utilisateurs
- Alexandre (FR, ELO 1450)
- Sophie (FR, ELO 1380)
- Thomas (CA, ELO 1520)
- Marie (BE, ELO 1290)
- Lucas (CH, ELO 1410)

### Relations d'Amitié
- Créées aléatoirement entre les utilisateurs
- Relations bidirectionnelles (A → B et B → A)
- ~70% de chance d'être amis

### Matches Historiques
- 3-5 matches aléatoires
- Résultats : WIN, LOSS, ou DRAW
- Dates dans les 7 derniers jours
- Scores et changements ELO réalistes

---

## 🚀 Utilisation

### 1. Installer les Dépendances

```bash
npm install
```

### 2. Exécuter le Script

```bash
node scripts/seedFirestore.js
```

### 3. Résultat Attendu

```
🔥 Seeding Firestore with test data...

Creating user: alexandre@test.com...
✅ Created: Alexandre (abc123...)
Creating user: sophie@test.com...
✅ Created: Sophie (def456...)
...

Creating friendships...
✅ Friendship: Alexandre ↔ Sophie
✅ Friendship: Thomas ↔ Marie
...

Creating matches...
✅ Match: Alexandre vs Sophie (WIN)
✅ Match: Thomas vs Lucas (DRAW)
...

✅ Seeding complete!
📊 Summary:
   - Users: 5
   - Friendships: 8
   - Matches: 4

🎯 Next steps:
   1. Wait for Firestore indexes to build (~5 min)
   2. Set EXPO_PUBLIC_USE_FIREBASE=true in .env
   3. Restart Expo: npx expo start --clear
```

---

## ⚠️ Notes Importantes

### Si "email-already-in-use"

Le script détecte les utilisateurs existants et les ignore :
```
⚠️  User already exists: alexandre@test.com
```

Pour recréer complètement :
1. Firebase Console → Authentication → Users → Supprimer tous
2. Firestore Database → Collections → Supprimer users, friendships, matches
3. Relancer le script

### Index Firestore

Après le premier lancement, vous verrez des erreurs "requires an index".

**C'est normal !** Cliquez sur les liens pour créer les index :
- Index 1 : users (status + lastSeen)
- Index 2 : friendships (userId + status + friendStatus)
- Index 3 : matches (player1Id + createdAt)

Attendez ~5 minutes que les index se construisent.

---

## 🔧 Personnalisation

### Modifier les Utilisateurs

Éditez `testUsers` dans `seedFirestore.js` :

```javascript
const testUsers = [
  { 
    email: 'votre@email.com', 
    password: 'VotrePassword!', 
    name: 'Votre Nom', 
    countryCode: 'FR', 
    elo: 1500 
  },
  // Ajoutez plus d'utilisateurs...
];
```

### Modifier le Nombre de Matches

Ligne 133 :
```javascript
const numMatches = 3 + Math.floor(Math.random() * 3); // 3-5 matches
// Changez en :
const numMatches = 10; // Toujours 10 matches
```

### Modifier la Probabilité d'Amitié

Ligne 83 :
```javascript
if (Math.random() > 0.3) { // 70% de chance
// Changez en :
if (Math.random() > 0.5) { // 50% de chance
```

---

## 🆘 Dépannage

### "Missing Firebase config"

→ Vérifier que `firebaseConfig` dans le script correspond à votre `.env`

### "Permission denied"

→ Vérifier les Security Rules Firestore (voir FIREBASE_SETUP.md)

### "Network error"

→ Vérifier votre connexion internet

### Script bloqué

→ Ctrl+C pour arrêter, puis relancer

---

## 🎯 Après le Seed

1. **Attendre les index** (~5 min)
2. **Activer Firebase** dans `.env` :
   ```env
   EXPO_PUBLIC_USE_FIREBASE=true
   ```
3. **Redémarrer Expo** :
   ```bash
   npx expo start --clear
   ```
4. **Tester l'app** : Les données Firebase devraient s'afficher !

---

## 📊 Vérification dans Firebase Console

### Authentication
```
Firebase Console → Authentication → Users
→ Devrait afficher 5 utilisateurs
```

### Firestore
```
Firebase Console → Firestore Database
→ Collection "users" : 5 documents
→ Collection "friendships" : 6-10 documents
→ Collection "matches" : 3-5 documents
```

---

## 🔄 Relancer le Script

Le script est **idempotent** :
- Utilisateurs existants → Ignorés
- Friendships → Recréées
- Matches → Ajoutés (pas de suppression)

Pour un reset complet, supprimez manuellement les collections dans Firestore.
