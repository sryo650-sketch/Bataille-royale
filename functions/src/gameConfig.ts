/**
 * Configuration centralisée du jeu
 * Facilite les ajustements d'équilibrage
 */

export const GAME_CONFIG = {
  // ⏱️ TIMERS
  RAPID_MODE_DURATION: 180, // 3 minutes (en secondes)
  ROUND_TIMEOUT: 10, // Temps max par round avant auto-lock (en secondes)
  MAX_TIMEOUTS: 6, // Nombre max de timeouts avant défaite automatique (6 × 10s = 1 minute)
  
  // ⚡ CHARGES SPÉCIALES
  ATTACK_BONUS: 10, // Bonus de la charge Attack
  DEFENSE_BONUS: 10, // Bonus de la charge Defense
  MAX_CHARGES: 3, // Maximum de charges stockables
  CHARGE_UNLOCK_INTERVAL: 10, // Gagner une charge tous les X rounds
  
  // 🎮 MODES DE JEU
  RAPID_STARTING_CHARGES: 3, // Charges au début en mode Rapid
  CLASSIC_STARTING_CHARGES: 0, // Charges au début en mode Classic
  
  // 🏆 CONDITIONS DE VICTOIRE
  DEFEAT_CONDITIONS: {
    // Mode Rapid : Défaite si timer écoulé
    RAPID_TIMEOUT_ENABLED: true,
    
    // Défaite si inactivité (pas de lock pendant X secondes)
    // En mode Rapid, si un joueur ne lock pas pendant ce délai, il perd
    INACTIVITY_TIMEOUT: 10, // 10 secondes d'inactivité = auto-lock (3 fois = défaite)
    
    // Défaite si abandon
    SURRENDER_ENABLED: true,
    
    // Défaite si plus de cartes
    NO_CARDS_DEFEAT: true,
  },
  
  // 📊 DÉTERMINATION DU GAGNANT (en cas de timeout)
  WINNER_DETERMINATION: {
    // En mode Rapid, si timer écoulé :
    // 'cards' : Celui avec le plus de cartes gagne (DÉCONSEILLÉ - permet l'anti-jeu)
    // 'score' : Celui avec le plus de rounds gagnés (RECOMMANDÉ - anti-jeu)
    // 'draw' : Match nul si égalité
    RAPID_TIMEOUT: 'score' as 'cards' | 'score' | 'draw',
    
    // Si égalité parfaite (même nombre de cartes/score)
    TIE_BREAKER: 'random' as 'player1' | 'player2' | 'random' | 'draw',
  },
  
  // 🎲 RÈGLES SPÉCIALES
  WAR_CARDS_COUNT: 3, // Nombre de cartes face cachée en cas de bataille
  POT_LIMIT: 52, // Maximum de cartes dans le pot (sécurité)
} as const;

/**
 * Messages de défaite personnalisables
 */
export const DEFEAT_MESSAGES = {
  normal: 'Défaite - Plus de cartes',
  inactivity: 'Défaite - Temps écoulé',
  surrender: 'Défaite - Abandon',
  timeout: 'Défaite - Inactivité',
} as const;

/**
 * Helper pour déterminer le gagnant en cas de timeout
 */
export function determineWinnerOnTimeout(
  p1Cards: number,
  p2Cards: number,
  p1Score: number,
  p2Score: number,
  mode: 'rapid' | 'classic'
): { winner: string; reason: string } {
  const config = GAME_CONFIG.WINNER_DETERMINATION;
  
  if (mode === 'rapid' && config.RAPID_TIMEOUT === 'cards') {
    if (p1Cards > p2Cards) {
      return { winner: 'player1', reason: `${p1Cards} cartes vs ${p2Cards}` };
    } else if (p2Cards > p1Cards) {
      return { winner: 'player2', reason: `${p2Cards} cartes vs ${p1Cards}` };
    }
  }
  
  if (mode === 'rapid' && config.RAPID_TIMEOUT === 'score') {
    if (p1Score > p2Score) {
      return { winner: 'player1', reason: `${p1Score} rounds gagnés vs ${p2Score}` };
    } else if (p2Score > p1Score) {
      return { winner: 'player2', reason: `${p2Score} rounds gagnés vs ${p1Score}` };
    }
  }
  
  // Égalité : utiliser le tie-breaker
  if (config.TIE_BREAKER === 'random') {
    const winner = Math.random() > 0.5 ? 'player1' : 'player2';
    return { winner, reason: 'Égalité - Tirage au sort' };
  }
  
  if (config.TIE_BREAKER === 'draw') {
    return { winner: 'draw', reason: 'Match nul' };
  }
  
  return { winner: config.TIE_BREAKER, reason: 'Égalité - Avantage joueur 1' };
}
