// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore - getReactNativePersistence existe à l'exécution mais pas dans les types
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Firebase (à remplir depuis Firebase Console)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validation de la config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.error('❌ Firebase config incomplete. Missing:', missingKeys.join(', '));
  throw new Error(`Missing Firebase config: ${missingKeys.join(', ')}`);
}

// Initialisation (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth avec persistence AsyncStorage pour React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

// Functions
const functions = getFunctions(app);

// 🧪 Émulateur Local (Développement uniquement)
// ⚠️ DÉSACTIVÉ : Utilisation de Firebase Production
// if (__DEV__) {
//   const { connectFunctionsEmulator } = require('firebase/functions');
//   const { connectFirestoreEmulator } = require('firebase/firestore');
//   
//   try {
//     connectFunctionsEmulator(functions, 'localhost', 5001);
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     console.log('🧪 Émulateurs Firebase connectés (localhost)');
//   } catch (error) {
//     console.warn('⚠️ Émulateurs non disponibles, utilisation de Firebase production');
//   }
// }

console.log('🔥 Firebase Production activé');

export { app, auth, db, storage, functions };
