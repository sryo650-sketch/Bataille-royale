// src/screens/HomeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/Button';
import { MOCK_FRIENDS, MOCK_RANDOM_PLAYERS, UI_CONSTANTS } from '../constants';

import { GameConfig, GameMode, NavigationHandler, Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserStats } from '../contexts/UserStatsContext';
import { useTheme, useThemeColor } from '../contexts/ThemeContext';
import { ThemeColors } from '../theme';
import { getFlagEmoji } from '../utils/countryUtils';

const placeholderAvatar = require('../assets/placeholder.png');
const LANGUAGE_STORAGE_KEY = 'userLang';

const isValidAvatarUrl = (url?: string): boolean => {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const allowedDomains: readonly string[] = UI_CONSTANTS.ALLOWED_AVATAR_DOMAINS;
    return parsed.protocol === 'https:' && allowedDomains.includes(parsed.hostname);
  } catch {
    return false;
  }
};

interface HomeScreenProps {
  onNavigate: NavigationHandler;
}

type ModeOption = {
  key: GameMode;
  title: string;
  description: string;
  accent: string;
  background: string;
  cta: string;
  badge?: string;
};

type RecentOpponentEntry = {
  matchId: string;
  name: string;
  countryCode: string;
  result: 'WIN' | 'LOSS';
  date: string;
};

type Friend = (typeof MOCK_FRIENDS)[number];
type RandomPlayer = (typeof MOCK_RANDOM_PLAYERS)[number];

const getAvatarSource = (avatar?: string) =>
  isValidAvatarUrl(avatar) ? { uri: avatar } : placeholderAvatar;

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { t, language, setLanguage } = useLanguage();
  const { stats } = useUserStats();
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const { toggle, effective } = useTheme();

  const colors = useThemeColor();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDarkTheme = effective === 'dark';

  // Extraire les 3 derniers adversaires uniques
  const recentOpponents = useMemo<RecentOpponentEntry[]>(() => {
    const seen = new Set<string>();
    const recent: RecentOpponentEntry[] = [];

    for (let i = stats.history.length - 1; i >= 0 && recent.length < 3; i--) {
      const match = stats.history[i];
      if (!seen.has(match.opponentName)) {
        seen.add(match.opponentName);

        recent.push({
          matchId: match.id,
          name: match.opponentName,
          countryCode: match.opponentCountry,
          result: match.result,
          date: match.date
        });
      }
    }

    return recent;
  }, [stats.history]);

  const themeToggleLabel = language === 'fr' ? 'Changer de thème' : 'Toggle theme';
  const scrollY = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage === 'fr' || storedLanguage === 'en') {
          setLanguage(storedLanguage);
        }
      } catch (error) {
        console.warn('Failed to load language preference', error);
      }
    };
    loadLanguagePreference();
  }, [setLanguage]);

  const toggleLanguage = () => {
    const newLanguage = language === 'fr' ? 'en' : 'fr';
    setLanguage(newLanguage);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage).catch(() => undefined);
  };

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200 }),
        withTiming(0.96, { duration: 1200 })
      ),
      -1,
      true
    );
  }, [pulse]);

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const clamp = Math.min(scrollY.value / 80, 1);
    return {
      transform: [{ translateY: -clamp * 10 }],
      opacity: 1 - clamp * 0.3,
    };
  });

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const clamp = Math.max(0, 1 - scrollY.value / 250);
    return {
      transform: [
        { translateY: -scrollY.value * 0.15 },
        { scale: 0.9 + 0.1 * clamp },
      ],
      opacity: 0.6 + 0.4 * clamp,
    };
  });

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const modeOptions: ModeOption[] = useMemo(
    () => [
      {
        key: 'classic',
        title: t.mode_classic,
        description: t.mode_classic_desc,
        accent: colors.gold,
        background: colors.surface,
        cta: t.play,
        badge: t.ranked_mode_badge,
      },
      {
        key: 'rapid',
        title: t.mode_rapid,
        description: t.mode_rapid_desc,
        accent: '#F97316',
        background: colors.surfaceAlt,
        cta: t.start_duel,
      },
      {
        key: 'daily',
        title: t.mode_daily,
        description: t.mode_daily_desc,
        accent: '#38BDF8',
        background: colors.surfaceMuted,
        cta: language === 'fr' ? 'À venir' : 'Coming Soon',
        badge: language === 'fr' ? 'Bientôt disponible' : 'Coming Soon',
      },
    ],
    [t, colors, language]
  );

  const formatMatchDate = useCallback(
    (dateString: string) => {
      try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
          return '';
        }
        return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
          month: 'short',
          day: 'numeric',
        }).format(date);
      } catch {
        return '';
      }
    },
    [language]
  );

  const handlePlay = useCallback(() => {
    const config: GameConfig = { mode: selectedMode };
    onNavigate(Screen.GAME, { gameConfig: config });
  }, [onNavigate, selectedMode]);

  const handleChallenge = useCallback((name: string, countryCode?: string, avatar?: string) => {
    const config: GameConfig = {
      mode: 'classic',
      opponent: {
        id: `challenge-${name}-${Date.now()}`,
        name,
        countryCode: countryCode ?? UI_CONSTANTS.DEFAULT_COUNTRY,
        avatar,
      },
    };
    onNavigate(Screen.GAME, { gameConfig: config });
  }, [onNavigate]);

  const handleDuel = useCallback((name: string, countryCode?: string, avatar?: string) => {
    const config: GameConfig = {
      mode: 'rapid',
      opponent: {
        id: `duel-${name}-${Date.now()}`,
        name,
        countryCode: countryCode ?? UI_CONSTANTS.DEFAULT_COUNTRY,
        avatar,
      },
    };
    onNavigate(Screen.GAME, { gameConfig: config });
  }, [onNavigate]);

  // Pré-binder les handlers pour éviter les arrow functions dans le render
  const recentOpponentsWithHandlers = useMemo(
    () => recentOpponents.map(opponent => ({
      ...opponent,
      onChallenge: () => handleChallenge(opponent.name, opponent.countryCode),
    })),
    [recentOpponents, handleChallenge]
  );

  const friendsWithHandlers = useMemo(
    () => MOCK_FRIENDS.map(friend => ({
      ...friend,
      onChallenge: () => handleChallenge(friend.name, friend.countryCode, friend.avatar),
      onDuel: () => handleDuel(friend.name, friend.countryCode, friend.avatar),
    })),
    [handleChallenge, handleDuel]
  );

  const randomPlayersWithHandlers = useMemo(
    () => MOCK_RANDOM_PLAYERS.map(player => ({
      ...player,
      onChallenge: () => handleChallenge(player.name, player.countryCode, player.avatar),
      onDuel: () => handleDuel(player.name, player.countryCode, player.avatar),
    })),
    [handleChallenge, handleDuel]
  );

  // Render functions simplifiées sans dépendances instables
  const renderRecentOpponent = useCallback(
    (item: RecentOpponentEntry & { onChallenge: () => void }, index: number) => (
      <Animated.View
        key={`recent-${item.matchId}-${item.date}`}
        entering={FadeInDown.delay(150 + index * 70)}
        style={styles.listWrapper}
      >
        <View
          style={[
            styles.recentOpponentRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceAlt,
            },
          ]}
        >
          <View style={styles.recentOpponentInfo}>
            <Text style={styles.recentOpponentName}>
              {item.name} {getFlagEmoji(item.countryCode) ?? '🏳️'}
            </Text>
            <Text style={styles.recentOpponentDate}>{formatMatchDate(item.date)}</Text>
          </View>
          <View style={styles.recentOpponentActions}>
            <Text
              style={[
                styles.recentOpponentResult,
                { color: item.result === 'WIN' ? '#22C55E' : '#EF4444' },
              ]}
            >
              {item.result === 'WIN' ? '✓' : '✗'}
            </Text>
            <Button
              size="sm"
              variant="outline"
              onPress={item.onChallenge}
            >
              <Text style={styles.challengeText}>{t.challenge}</Text>
            </Button>
          </View>
        </View>
      </Animated.View>
    ),
    [colors.surface, colors.surfaceAlt, formatMatchDate, styles, t.challenge]
  );

  const renderFriendItem = useCallback(
    (item: Friend & { onChallenge: () => void; onDuel: () => void }, index: number) => (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(200 + index * 70)}
        style={styles.listWrapper}
      >
        <View
          style={[
            styles.friendRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceAlt,
            },
          ]}
        >
          <View style={styles.friendInfo}>
            <Image source={getAvatarSource(item.avatar)} style={styles.friendAvatar} />
            <View>
              <Text style={styles.friendName}>{item.name}</Text>
              <Text style={styles.friendStatus}>
                {item.status === 'In Game'
                  ? t.in_game
                  : item.status === 'Online'
                    ? t.online
                    : t.offline}
              </Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <Button
              size="sm"
              variant="outline"
              onPress={item.onDuel}
            >
              <Text style={styles.duelText}>{t.duel}</Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={item.onChallenge}
            >
              <Text style={styles.challengeText}>{t.challenge}</Text>
            </Button>
          </View>
        </View>
      </Animated.View>
    ),
    [colors.surface, colors.surfaceAlt, styles, t]
  );

  const renderRandomPlayer = useCallback(
    (item: RandomPlayer & { onChallenge: () => void; onDuel: () => void }, index: number) => (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(400 + index * 70)}
        style={styles.listWrapper}
      >
        <View
          style={[
            styles.randomRow,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.surfaceAlt,
            },
          ]}
        >
          <View style={styles.randomInfo}>
            <Image source={getAvatarSource(item.avatar)} style={styles.randomAvatar} />
            <View>
              <View style={styles.randomNameRow}>
                <Text style={styles.randomName}>{item.name}</Text>
                <Text style={styles.randomFlag}>
                  {getFlagEmoji(item.countryCode) ?? '🏳️'}
                </Text>
              </View>
              <Text style={styles.randomMeta}>{`${item.mode} · ${item.timeAgo}`}</Text>
            </View>
          </View>
          <View style={styles.randomRight}>
            <Text style={styles.randomElo}>{item.elo} ELO</Text>
            <View style={styles.actionButtons}>
              <Button
                size="sm"
                variant="outline"
                onPress={item.onDuel}
              >
                <Text style={styles.duelText}>{t.duel}</Text>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={item.onChallenge}
              >
                <Text style={styles.challengeText}>{t.challenge}</Text>
              </Button>
            </View>
          </View>
        </View>
      </Animated.View>
    ),
    [colors.surfaceAlt, colors.surfaceMuted, styles, t]
  );

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.headerRow, headerAnimatedStyle]}>
          <View style={styles.leftBadges}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakValue}>{stats.currentStreak}</Text>
              <Text style={styles.streakLabel}>{t.streak}</Text>
            </View>
            <View style={styles.availableChargesBadge}>
              <Text style={styles.availableChargesValue}>
                {stats.availableCharges || 0}/3 ⚡
              </Text>
              <Text style={styles.availableChargesLabel}>{t.charges}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.view_stats}
              onPress={() => onNavigate(Screen.STATS)}
              style={styles.profileWrapper}
            >
              <View style={styles.profileInfo}>
                <Text style={styles.rankLabel}>{t.rank_elo}</Text>
                <Text style={styles.rankValue}>{stats.elo}</Text>
              </View>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarFlag}>
                  {getFlagEmoji(stats.countryCode) ?? '🏳️'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.toggle_language}
              onPress={toggleLanguage}
              style={styles.languageToggle}
            >
              <Text style={styles.languageText}>{language.toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={themeToggleLabel}
              onPress={toggle}
              style={styles.themeToggle}
            >
              <Text style={styles.themeToggleIcon}>
                {isDarkTheme ? '🌙' : '☀️'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={language === 'fr' ? 'Paramètres' : 'Settings'}
              onPress={() => onNavigate(Screen.SETTINGS)}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.hero, heroAnimatedStyle]}>
          <Text style={styles.heroTitle}>PUGNA REGALIS</Text>
          <Text style={styles.heroSubtitle}>{t.edition_royale}</Text>
        </Animated.View>

        <View style={styles.modesSection}>
          {modeOptions.map((option, i) => (
            <Animated.View key={option.key} entering={FadeInDown.delay(i * 80)}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: option.background,
                    borderColor: selectedMode === option.key ? option.accent : 'transparent',
                  },
                  selectedMode === option.key && styles.modeCardActive,
                ]}
                onPress={() => setSelectedMode(option.key)}
              >
                <View style={styles.modeCardHeader}>
                  <Text style={styles.modeCardTitle}>{option.title}</Text>
                  {selectedMode === option.key && (
                    <Text style={styles.modeCardBadge}>✓</Text>
                  )}
                </View>
                {option.badge && (
                  <View style={styles.modeInfoBadge}>
                    <Text style={styles.modeInfoBadgeText}>{option.badge}</Text>
                  </View>
                )}
                <Text style={styles.modeCardDescription}>{option.description}</Text>
                <View style={styles.modeCardFooter}>
                  <Text style={[styles.modeCardCTA, { color: option.accent }]}>
                    {option.cta}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
          <Animated.View style={[styles.playButtonWrapper, ctaAnimatedStyle]}>
            <Button
              onPress={selectedMode === 'daily' ? undefined : handlePlay}
              size="lg"
              fullWidth
              disabled={selectedMode === 'daily'}
            >
              <Text style={[
                styles.playText,
                selectedMode === 'daily' && { opacity: 0.5 }
              ]}>
                {selectedMode === 'daily'
                  ? (language === 'fr' ? 'Bientôt disponible' : 'Coming Soon')
                  : (selectedMode === 'rapid' ? t.start_duel : t.play)
                }
              </Text>
            </Button>
          </Animated.View>
        </View>

        {/* Derniers adversaires */}
        {recentOpponents.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.recent_opponents}</Text>
            </View>
            <View style={styles.listContentSpacing}>
              {recentOpponentsWithHandlers.map((item, index) => renderRecentOpponent(item, index))}
            </View>
            <View style={styles.sectionDivider} />
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.friends_online}</Text>
          <Text style={styles.sectionAction}>{t.see_all}</Text>
        </View>
        <View style={styles.listContentSpacing}>
          {friendsWithHandlers.map((item, index) => renderFriendItem(item, index))}
        </View>
        <View style={styles.sectionDivider} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.random_encounters}</Text>
          <Text style={styles.sectionAction}>{t.refresh}</Text>
        </View>
        <View style={styles.listContentSpacing}>
          {randomPlayersWithHandlers.map((item, index) => renderRandomPlayer(item, index))}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 48,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    leftBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    streakBadge: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
    },
    streakValue: {
      color: '#F97316',
      fontWeight: '700',
      fontSize: 18,
    },
    streakLabel: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    availableChargesBadge: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: '#3B82F6',
    },
    availableChargesValue: {
      color: '#3B82F6',
      fontWeight: '900',
      fontSize: 16,
    },
    availableChargesLabel: {
      color: colors.textSecondary,
      fontSize: 10,
    },
    chargesBadge: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },
    chargesValue: {
      color: '#FBBF24',
      fontWeight: '900',
      fontSize: 16,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    settingsButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    settingsIcon: {
      fontSize: 20,
    },
    themeToggle: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      marginRight: 12,
    },
    themeToggleIcon: {
      color: colors.primary,
      fontSize: 16,
    },
    languageToggle: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      marginRight: 12,
    },
    languageText: {
      color: colors.gold,
      fontWeight: '700',
    },
    profileWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileInfo: {
      marginRight: 8,
    },
    rankLabel: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    rankValue: {
      color: colors.gold,
      fontWeight: '700',
    },
    avatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarFlag: {
      fontSize: 18,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 24,
    },
    heroTitle: {
      fontSize: 36,
      fontWeight: '900',
      color: colors.gold,
    },
    heroSubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    modesSection: {
      marginBottom: 24,
      gap: 12,
    },
    playButtonWrapper: {
      marginTop: 4,
    },
    modeCard: {
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
    },
    modeCardActive: {
      borderColor: colors.gold,
      shadowColor: colors.gold,
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    modeCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    modeCardTitle: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 18,
    },
    modeCardBadge: {
      color: '#FDE68A',
      fontWeight: '700',
      fontSize: 12,
    },
    modeCardDescription: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 12,
    },
    modeCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modeInfoBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(212, 175, 55, 0.12)',
      borderColor: colors.gold,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginBottom: 10,
    },
    modeInfoBadgeText: {
      color: colors.gold,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    modeCardCTA: {
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    playText: {
      color: colors.black,
      fontWeight: '700',
      fontSize: 18,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontWeight: '700',
    },
    sectionAction: {
      color: colors.gold,
      fontSize: 12,
    },
    socialList: {
      flex: 1,
    },
    socialContent: {
      paddingBottom: 24,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.surfaceAlt,
      marginVertical: 12,
    },
    listWrapper: {
      width: '100%',
    },
    listContentSpacing: {
      gap: 8,
    },
    friendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.surfaceAlt,
      marginBottom: 8,
    },
    friendInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    friendAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    friendName: {
      color: colors.text,
      fontWeight: '700',
    },
    friendStatus: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    duelText: {
      color: '#F97316',
      fontSize: 12,
      fontWeight: '700',
    },
    challengeText: {
      color: colors.gold,
      fontSize: 12,
      fontWeight: '700',
    },
    randomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.surfaceAlt,
      marginBottom: 8,
    },
    randomInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    randomAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
    },
    randomNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    randomName: {
      color: colors.text,
      fontWeight: '700',
      marginRight: 6,
    },
    randomFlag: {
      fontSize: 16,
    },
    randomMeta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    randomRight: {
      alignItems: 'flex-end',
      gap: 6,
    },
    randomElo: {
      color: colors.gold,
      fontWeight: '700',
    },
    recentOpponentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 8,
    },
    recentOpponentInfo: {
      flex: 1,
    },
    recentOpponentName: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 15,
      marginBottom: 4,
    },
    recentOpponentDate: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    recentOpponentActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    recentOpponentResult: {
      fontSize: 20,
      fontWeight: '900',
    },
  });