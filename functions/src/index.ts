import * as admin from 'firebase-admin';

// Initialiser Firebase Admin
admin.initializeApp();

// Exports des fonctions
export { createGame } from './createGame';
export { lockCard } from './lockCard';
export { useSpecial } from './useSpecial';
export { surrender } from './surrender';
// Scheduled functions désactivées (problèmes de syntaxe + coût)
// export { updateRapidTimer } from './updateRapidTimer';
// export { checkInactivity } from './checkInactivity';
