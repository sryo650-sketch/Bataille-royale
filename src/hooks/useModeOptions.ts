import { useMemo } from 'react';
import { GameMode } from '../types';

export type ModeOption = {
  key: GameMode;
  title: string;
  description: string;
  accentKey: 'gold' | 'orange' | 'blue';
  backgroundKey: 'surface' | 'surfaceAlt' | 'surfaceMuted';
  cta: string;
  badge?: string;
};

type Translations = {
  mode_classic: string;
  mode_classic_desc: string;
  mode_rapid: string;
  mode_rapid_desc: string;
  mode_daily: string;
  mode_daily_desc: string;
  ranked_mode_badge: string;
  play: string;
  start_duel: string;
};

export const useModeOptions = (t: Translations, language: 'fr' | 'en'): ModeOption[] => {
  return useMemo(
    () => [
      {
        key: 'classic' as GameMode,
        title: t.mode_classic,
        description: t.mode_classic_desc,
        accentKey: 'gold' as const,
        backgroundKey: 'surface' as const,
        cta: t.play,
        badge: t.ranked_mode_badge,
      },
      {
        key: 'rapid' as GameMode,
        title: t.mode_rapid,
        description: t.mode_rapid_desc,
        accentKey: 'orange' as const,
        backgroundKey: 'surfaceAlt' as const,
        cta: t.start_duel,
      },
      {
        key: 'daily' as GameMode,
        title: t.mode_daily,
        description: t.mode_daily_desc,
        accentKey: 'blue' as const,
        backgroundKey: 'surfaceMuted' as const,
        cta: language === 'fr' ? 'À venir' : 'Coming Soon',
        badge: language === 'fr' ? 'Bientôt disponible' : 'Coming Soon',
      },
    ],
    [t, language]
  );
};
