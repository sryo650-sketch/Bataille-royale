// scripts/seedFirestore.js
// Script pour créer des données de test dans Firestore
// Usage : node scripts/seedFirestore.js

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp, collection, query, where, getDocs } = require('firebase/firestore');

// Configuration Firebase (copier depuis .env)
const firebaseConfig = {
  apiKey: "AIzaSyBLQvov4u9PYndACrAQqcnO0eMDgD8qZ60",
  authDomain: "pugna-regalis.firebaseapp.com",
  projectId: "pugna-regalis",
  storageBucket: "pugna-regalis.firebasestorage.app",
  messagingSenderId: "1040033793128",
  appId: "1:1040033793128:web:946df613420da482f267dd",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Utilisateurs à créer
const testUsers = [
  { email: 'alexandre@test.com', password: 'Test1234!', name: 'Alexandre', countryCode: 'FR', elo: 1450 },
  { email: 'sophie@test.com', password: 'Test1234!', name: 'Sophie', countryCode: 'FR', elo: 1380 },
  { email: 'thomas@test.com', password: 'Test1234!', name: 'Thomas', countryCode: 'CA', elo: 1520 },
  { email: 'marie@test.com', password: 'Test1234!', name: 'Marie', countryCode: 'BE', elo: 1290 },
  { email: 'lucas@test.com', password: 'Test1234!', name: 'Lucas', countryCode: 'CH', elo: 1410 },
];

async function createUser(userData) {
  try {
    console.log(`Creating user: ${userData.email}...`);
    
    // Créer dans Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const user = userCredential.user;

    // Créer le profil Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: userData.name,
      email: userData.email,
      countryCode: userData.countryCode,
      elo: userData.elo,
      currentStreak: Math.floor(Math.random() * 5),
      bestStreak: Math.floor(Math.random() * 10),
      totalWins: Math.floor(Math.random() * 50),
      totalLosses: Math.floor(Math.random() * 40),
      totalDraws: Math.floor(Math.random() * 5),
      availableCharges: 5,
      lastChargeRefill: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      status: 'online',
    });

    console.log(`✅ Created: ${userData.name} (${user.uid})`);
    return user.uid;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  User already exists: ${userData.email}, fetching UID...`);
      // Récupérer l'UID depuis Firestore
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userData.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const uid = querySnapshot.docs[0].id;
          console.log(`✅ Found existing user: ${userData.name} (${uid})`);
          return uid;
        } else {
          console.log(`❌ User exists in Auth but not in Firestore: ${userData.email}`);
          return null;
        }
      } catch (fetchError) {
        console.error(`❌ Error fetching user ${userData.email}:`, fetchError.message);
        return null;
      }
    } else {
      console.error(`❌ Error creating ${userData.email}:`, error.message);
    }
    return null;
  }
}

async function createFriendships(userIds, userData) {
  console.log('\nCreating friendships...');
  
  let friendshipCount = 0;
  
  // Créer des relations d'amitié entre les utilisateurs
  for (let i = 0; i < userIds.length - 1; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      if (Math.random() > 0.3) { // 70% de chance d'être amis
        try {
          // Friendship pour userId[i] → userId[j]
          const friendshipId1 = `${userIds[i]}_${userIds[j]}`;
          await setDoc(doc(db, 'friendships', friendshipId1), {
            userId: userIds[i],
            friendId: userIds[j],
            status: 'accepted',
            friendName: userData[j].name,
            friendAvatar: null,
            friendCountryCode: userData[j].countryCode,
            friendElo: userData[j].elo,
            friendStatus: 'online',
            createdAt: serverTimestamp(),
            acceptedAt: serverTimestamp(),
          });

          // Friendship inverse pour userId[j] → userId[i]
          const friendshipId2 = `${userIds[j]}_${userIds[i]}`;
          await setDoc(doc(db, 'friendships', friendshipId2), {
            userId: userIds[j],
            friendId: userIds[i],
            status: 'accepted',
            friendName: userData[i].name,
            friendAvatar: null,
            friendCountryCode: userData[i].countryCode,
            friendElo: userData[i].elo,
            friendStatus: 'online',
            createdAt: serverTimestamp(),
            acceptedAt: serverTimestamp(),
          });

          console.log(`✅ Friendship: ${userData[i].name} ↔ ${userData[j].name}`);
          friendshipCount += 2;
        } catch (error) {
          console.error(`❌ Error creating friendship:`, error.message);
        }
      }
    }
  }
  
  return friendshipCount;
}

async function createMatches(userIds, userData) {
  console.log('\nCreating matches...');
  
  let matchCount = 0;
  
  // Créer 3-5 matches aléatoires
  const numMatches = 3 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numMatches; i++) {
    try {
      // Sélectionner 2 joueurs aléatoires
      const idx1 = Math.floor(Math.random() * userIds.length);
      let idx2 = Math.floor(Math.random() * userIds.length);
      while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * userIds.length);
      }

      const player1Id = userIds[idx1];
      const player2Id = userIds[idx2];
      const player1Data = userData[idx1];
      const player2Data = userData[idx2];

      // Résultat aléatoire
      const results = ['WIN', 'LOSS', 'DRAW'];
      const result = results[Math.floor(Math.random() * results.length)];
      
      // Scores
      let player1Score, player2Score;
      if (result === 'WIN') {
        player1Score = 14 + Math.floor(Math.random() * 5);
        player2Score = Math.floor(Math.random() * 13);
      } else if (result === 'LOSS') {
        player1Score = Math.floor(Math.random() * 13);
        player2Score = 14 + Math.floor(Math.random() * 5);
      } else {
        player1Score = 13;
        player2Score = 13;
      }

      // Changement ELO
      const eloChange = 15 + Math.floor(Math.random() * 20);
      const player1EloChange = result === 'WIN' ? eloChange : result === 'LOSS' ? -eloChange : 0;
      const player2EloChange = -player1EloChange;

      // Date aléatoire dans les 7 derniers jours
      const daysAgo = Math.floor(Math.random() * 7);
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() - daysAgo);

      // Créer le match
      const matchRef = doc(db, 'matches', `match_${Date.now()}_${i}`);
      await setDoc(matchRef, {
        player1Id,
        player2Id,
        player1Name: player1Data.name,
        player2Name: player2Data.name,
        player1CountryCode: player1Data.countryCode,
        player2CountryCode: player2Data.countryCode,
        player1Avatar: null,
        player2Avatar: null,
        mode: Math.random() > 0.5 ? 'classic' : 'rapid',
        result,
        rounds: [], // Simplifié pour le seed
        finalScore: {
          player1: player1Score,
          player2: player2Score,
        },
        player1EloChange,
        player2EloChange,
        duration: 120 + Math.floor(Math.random() * 180),
        createdAt: matchDate,
        completedAt: matchDate,
      });

      console.log(`✅ Match: ${player1Data.name} vs ${player2Data.name} (${result})`);
      matchCount++;
    } catch (error) {
      console.error(`❌ Error creating match:`, error.message);
    }
  }
  
  return matchCount;
}

async function main() {
  console.log('🔥 Seeding Firestore with test data...\n');

  // Créer les utilisateurs
  const userIds = [];
  const createdUsers = [];
  
  for (const userData of testUsers) {
    const uid = await createUser(userData);
    if (uid) {
      userIds.push(uid);
      createdUsers.push(userData);
    }
    // Attendre un peu entre chaque création
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Créer les friendships
  let friendshipCount = 0;
  if (userIds.length > 1) {
    friendshipCount = await createFriendships(userIds, createdUsers);
  }

  // Créer les matches
  let matchCount = 0;
  if (userIds.length > 1) {
    matchCount = await createMatches(userIds, createdUsers);
  }

  console.log('\n✅ Seeding complete!');
  console.log(`📊 Summary:`);
  console.log(`   - Users: ${userIds.length}`);
  console.log(`   - Friendships: ${friendshipCount}`);
  console.log(`   - Matches: ${matchCount}`);
  console.log('\n🎯 Next steps:');
  console.log('   1. Wait for Firestore indexes to build (~5 min)');
  console.log('   2. Set EXPO_PUBLIC_USE_FIREBASE=true in .env');
  console.log('   3. Restart Expo: npx expo start --clear');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
