// Centralized exports for custom hooks
export { useGameNavigation } from './useGameNavigation';
export { useModeOptions } from './useModeOptions';
export type { ModeOption } from './useModeOptions';

// Firebase hooks (Production)
export { useFirestoreQuery } from './useFirestoreQuery';
export { useFriendsFirebase } from './useFriendsFirebase';
export { useRecentOpponentsFirebase } from './useRecentOpponentsFirebase';
export { useRandomPlayersFirebase } from './useRandomPlayersFirebase';

// Game Realtime hooks (Server-Authoritative)
export { useGameRealtime } from './useGameRealtime';
export { useGameActions } from './useGameActions';
export { useInactivityTimer } from './useInactivityTimer';

// ❌ REMOVED: useRecentOpponents (mock) - replaced by useRecentOpponentsFirebase
