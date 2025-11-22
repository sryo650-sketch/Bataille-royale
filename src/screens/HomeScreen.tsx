// src/screens/HomeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
import { RecentOpponentRow, FriendRow, RandomPlayerRow } from '../components/home';
import { UI_CONSTANTS } from '../constants';
import { GameMode, NavigationHandler, Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserStats } from '../contexts/UserStatsContext';
import { useTheme, useThemeColor } from '../contexts/ThemeContext';
import { ThemeColors } from '../theme';
import { getFlagEmoji } from '../utils/countryUtils';
import {
  useGameNavigation,
  useModeOptions,
  useFriendsFirebase,
  useRecentOpponentsFirebase,
  useRandomPlayersFirebase,
} from '../hooks';

const LANGUAGE_STORAGE_KEY = 'userLang';

interface HomeScreenProps {
  onNavigate: NavigationHandler;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { t, language, setLanguage } = useLanguage();
  const { stats } = useUserStats();
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const { toggle, effective } = useTheme();
  const colors = useThemeColor();

  const isDarkTheme = effective === 'dark';
  const scrollY = useSharedValue(0);
  const pulse = useSharedValue(1);

  // Custom hooks
  const modeOptions = useModeOptions(t, language);
  const { handlePlay, handleChallenge, handleDuel } = useGameNavigation(onNavigate);

  // 🔥 Firebase hooks
  const { recentOpponents, loading: opponentsLoading } = useRecentOpponentsFirebase(3);
  const { friends, loading: friendsLoading } = useFriendsFirebase();
  const { randomPlayers, loading: playersLoading } = useRandomPlayersFirebase(5);
  const isLoading = opponentsLoading || friendsLoading || playersLoading;

  // Pré-binder les handlers
  const recentOpponentsWithHandlers = useMemo(
    () => recentOpponents.map(opponent => ({
      ...opponent,
      onChallenge: () => handleChallenge(opponent.name, opponent.countryCode),
    })),
    [recentOpponents, handleChallenge]
  );

  const friendsWithHandlers = useMemo(
    () => friends.map(friend => ({
      ...friend,
      onChallenge: () => handleChallenge(friend.name, friend.countryCode, friend.avatar),
      onDuel: () => handleDuel(friend.name, friend.countryCode, friend.avatar),
    })),
    [friends, handleChallenge, handleDuel]
  );

  const randomPlayersWithHandlers = useMemo(
    () => randomPlayers.map(player => ({
      ...player,
      onChallenge: () => handleChallenge(player.name, player.countryCode, player.avatar),
      onDuel: () => handleDuel(player.name, player.countryCode, player.avatar),
    })),
    [randomPlayers, handleChallenge, handleDuel]
  );

  // Language toggle
  const toggleLanguage = useCallback(() => {
    const newLanguage = language === 'fr' ? 'en' : 'fr';
    setLanguage(newLanguage);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage).catch(() => undefined);
  }, [language, setLanguage]);

  // Load language preference
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

  // Animations
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

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <Animated.View style={[styles.headerRow, headerAnimatedStyle]}>
          <View style={styles.leftBadges}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakValue}>{stats.currentStreak}</Text>
              <Text style={styles.streakLabel}>{t.streak}</Text>
            </View>
            <View style={styles.availableChargesBadge}>
              <Text style={styles.availableChargesValue}>
                {stats.availableCharges || 0}/{UI_CONSTANTS.MAX_CHARGES} ⚡
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
              accessibilityLabel={language === 'fr' ? 'Changer de thème' : 'Toggle theme'}
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

        {/* Hero */}
        <Animated.View style={[styles.hero, heroAnimatedStyle]}>
          <Text style={styles.heroTitle}>PUGNA REGALIS</Text>
          <Text style={styles.heroSubtitle}>{t.edition_royale}</Text>
        </Animated.View>

        {/* Mode Selector */}
        <View style={styles.modesSection}>
          {modeOptions.map((option, i) => (
            <Animated.View key={option.key} entering={FadeInDown.delay(i * 80)}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: colors[option.backgroundKey],
                    borderColor: selectedMode === option.key ? colors[option.accentKey] : 'transparent',
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
                  <Text style={[styles.modeCardCTA, { color: colors[option.accentKey] }]}>
                    {option.cta}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
          <Animated.View style={[styles.playButtonWrapper, ctaAnimatedStyle]}>
            <Button
              onPress={selectedMode === 'daily' ? undefined : () => handlePlay(selectedMode)}
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

        {/* Recent Opponents */}
        {recentOpponents.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.recent_opponents}</Text>
            </View>
            <View style={styles.listContentSpacing}>
              {recentOpponentsWithHandlers.map((item, index) => (
                <RecentOpponentRow
                  key={`recent-${item.matchId}-${item.date}`}
                  item={item}
                  index={index}
                />
              ))}
            </View>
            <View style={styles.sectionDivider} />
          </>
        )}

        {/* Friends List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.friends_online}</Text>
          <Text style={styles.sectionAction}>{t.see_all}</Text>
        </View>
        <View style={styles.listContentSpacing}>
          {friendsWithHandlers.map((item, index) => (
            <FriendRow
              key={item.id}
              item={item}
              index={index}
            />
          ))}
        </View>
        <View style={styles.sectionDivider} />

        {/* Random Players */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.random_encounters}</Text>
          <Text style={styles.sectionAction}>{t.refresh}</Text>
        </View>
        <View style={styles.listContentSpacing}>
          {randomPlayersWithHandlers.map((item, index) => (
            <RandomPlayerRow
              key={item.id}
              item={item}
              index={index}
            />
          ))}
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
      paddingBottom: UI_CONSTANTS.SPACING_LARGE,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: UI_CONSTANTS.SPACING_MEDIUM,
    },
    leftBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: UI_CONSTANTS.SPACING_TINY,
    },
    streakBadge: {
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: UI_CONSTANTS.BORDER_RADIUS_FULL,
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
      paddingHorizontal: UI_CONSTANTS.SPACING_SMALL,
      paddingVertical: 8,
      borderRadius: UI_CONSTANTS.BORDER_RADIUS_FULL,
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
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: UI_CONSTANTS.SPACING_SMALL,
    },
    settingsButton: {
      paddingHorizontal: UI_CONSTANTS.SPACING_SMALL,
      paddingVertical: 6,
      borderRadius: UI_CONSTANTS.BORDER_RADIUS_FULL,
      backgroundColor: colors.surfaceAlt,
    },
    settingsIcon: {
      fontSize: 20,
    },
    themeToggle: {
      paddingHorizontal: UI_CONSTANTS.SPACING_SMALL,
      paddingVertical: 6,
      borderRadius: UI_CONSTANTS.BORDER_RADIUS_FULL,
      backgroundColor: colors.surfaceAlt,
      marginRight: UI_CONSTANTS.SPACING_SMALL,
    },
    themeToggleIcon: {
      color: colors.primary,
      fontSize: 16,
    },
    languageToggle: {
      paddingHorizontal: UI_CONSTANTS.SPACING_SMALL,
      paddingVertical: 6,
      borderRadius: UI_CONSTANTS.BORDER_RADIUS_FULL,
      backgroundColor: colors.surfaceAlt,
      marginRight: UI_CONSTANTS.SPACING_SMALL,
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
      marginBottom: UI_CONSTANTS.SPACING_MEDIUM,
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
      marginBottom: UI_CONSTANTS.SPACING_MEDIUM,
      gap: UI_CONSTANTS.SPACING_SMALL,
    },
    playButtonWrapper: {
      marginTop: 4,
    },
    modeCard: {
      borderWidth: 1,
      borderRadius: UI_CONSTANTS.BORDER_RADIUS_CARD,
      padding: 16,
      marginBottom: UI_CONSTANTS.SPACING_SMALL,
    },
    modeCardActive: {
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
      marginBottom: UI_CONSTANTS.SPACING_SMALL,
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
      borderRadius: UI_CONSTANTS.BORDER_RADIUS_FULL,
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
    sectionDivider: {
      height: 1,
      backgroundColor: colors.surfaceAlt,
      marginVertical: UI_CONSTANTS.SPACING_SMALL,
    },
    listContentSpacing: {
      gap: UI_CONSTANTS.SPACING_TINY,
    },
  });
