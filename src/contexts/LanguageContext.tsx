import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Language = 'fr' | 'en';

export const translations = {
  fr: {
    streak: 'Série',
    rank_elo: 'RANG ELO',
    play: 'JOUER',
    friendly: 'Amical',
    ranked: 'Classé',
    friends_online: 'Amis en ligne',
    see_all: 'Voir tout',
    challenge: 'Défier',
    online: 'En ligne',
    in_game: 'En Jeu',
    offline: 'Hors ligne',
    tap_start: 'Touche pour commencer',
    tap_card: 'Touche ta carte',
    ready_fight: 'Prêt à combattre ?',
    duel_imminent: 'Duel imminent...',
    battle: 'BATAILLE !',
    round_won: 'Manche Gagnée !',
    round_lost: 'Manche Perdue...',
    touch_to_see: 'TOUCHER POUR VOIR',
    look_card: 'Regarde ta carte...',
    your_turn: 'À ton tour...',
    fight: 'COMBATTRE',
    waiting: 'En attente...',
    victory: 'VICTOIRE',
    defeat: 'DÉFAITE',
    won_all: 'Vous avez remporté toutes les cartes.',
    lost_all: 'Vous avez perdu toutes vos cartes.',
    return_menu: 'Retour au Menu',
    ready: 'PRÊT',
    pot: 'EN JEU',
    me: 'TOI',
    opponent: 'Adversaire',
    my_profile: 'Mon Profil',
    current_rank: 'Rang Actuel',
    top_percent: 'TOP 5%',
    win_rate: 'Victoires',
    success_rate: 'Taux de succès',
    games: 'Parties',
    games_played: 'Jouées au total',
    record: 'Record',
    cards_won: 'Cartes',
    cards_captured: 'Cartes capturées',
    history: 'Derniers Matchs',
    jack: 'V',
    queen: 'D',
    king: 'R',
    ace: 'A',
  },
  en: {
    streak: 'Streak',
    rank_elo: 'ELO RANK',
    play: 'PLAY',
    friendly: 'Friendly',
    ranked: 'Ranked',
    friends_online: 'Online Friends',
    see_all: 'See All',
    challenge: 'Challenge',
    online: 'Online',
    in_game: 'In Game',
    offline: 'Offline',
    tap_start: 'Tap to start',
    tap_card: 'Tap your card',
    ready_fight: 'Ready to fight?',
    duel_imminent: 'Duel imminent...',
    battle: 'WAR!',
    round_won: 'Round Won!',
    round_lost: 'Round Lost...',
    touch_to_see: 'TAP TO REVEAL',
    look_card: 'Check your card...',
    your_turn: 'Your turn...',
    fight: 'FIGHT',
    waiting: 'Waiting...',
    victory: 'VICTORY',
    defeat: 'DEFEAT',
    won_all: 'You have won all the cards.',
    lost_all: 'You have lost all your cards.',
    return_menu: 'Back to Menu',
    ready: 'READY',
    pot: 'AT STAKE',
    me: 'YOU',
    opponent: 'Opponent',
    my_profile: 'My Profile',
    current_rank: 'Current Rank',
    top_percent: 'TOP 5%',
    win_rate: 'Win Rate',
    success_rate: 'Success rate',
    games: 'Games',
    games_played: 'Total played',
    record: 'Record',
    cards_won: 'Cards',
    cards_captured: 'Cards captured',
    history: 'Match History',
    jack: 'J',
    queen: 'Q',
    king: 'K',
    ace: 'A',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.fr;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
