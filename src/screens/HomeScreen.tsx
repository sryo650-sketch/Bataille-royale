import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/Button';
import { MOCK_FRIENDS, MOCK_RANDOM_PLAYERS } from '../constants';
import { GameConfig, GameMode, NavigationHandler, Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserStats } from '../contexts/UserStatsContext';
import { getFlagEmoji } from '../utils/countryUtils';

const placeholderAvatar = require('../assets/placeholder.png');
const LANGUAGE_STORAGE_KEY = 'userLang';

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
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { t, language, setLanguage } = useLanguage();
  const { stats } = useUserStats();
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');

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

  const modeOptions: ModeOption[] = useMemo(() => ([
    {
      key: 'classic',
      title: t.mode_classic,
      description: t.mode_classic_desc,
      accent: '#D4AF37',
      background: '#0F172A',
      cta: t.play,
    },
    {
      key: 'rapid',
      title: t.mode_rapid,
      description: t.mode_rapid_desc,
      accent: '#F97316',
      background: '#1E1B4B',
      cta: t.start_duel,
    },
    {
      key: 'daily',
      title: t.mode_daily,
      description: t.mode_daily_desc,
      accent: '#38BDF8',
      background: '#0F172A',
      cta: t.view_daily_details,
    },
  ]), [t]);

  const handlePlay = () => {
    const config: GameConfig = { mode: selectedMode };
    onNavigate(Screen.GAME, { gameConfig: config });
  };

  const handleChallenge = (name: string, countryCode?: string, avatar?: string) => {
    const config: GameConfig = {
      mode: 'classic',
      opponent: {
        id: `challenge-${name}`,
        name,
        countryCode: countryCode ?? 'FR',
        avatar,
      },
    };
    onNavigate(Screen.GAME, { gameConfig: config });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.streakBadge}>
          <Text style={styles.streakValue}>{stats.currentStreak}</Text>
          <Text style={styles.streakLabel}>{t.streak}</Text>
        </View>
        <View style={styles.headerRight}>
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
            accessibilityLabel={t.view_stats}
            onPress={() => onNavigate(Screen.STATS)}
            style={styles.profileWrapper}
          >
            <View style={styles.profileInfo}>
              <Text style={styles.rankLabel}>{t.rank_elo}</Text>
              <Text style={styles.rankValue}>{stats.elo}</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarFlag}>{getFlagEmoji(stats.countryCode) ?? '🏳️'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>BATAILLE</Text>
        <Text style={styles.heroSubtitle}>Edition Royale</Text>
      </View>

      <View style={styles.modesSection}>
        {modeOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.9}
            style={[
              styles.modeCard,
              { backgroundColor: option.background, borderColor: option.accent },
              selectedMode === option.key ? styles.modeCardActive : null,
            ]}
            onPress={() => setSelectedMode(option.key)}
          >
            <View style={styles.modeCardHeader}>
              <Text style={styles.modeCardTitle}>{option.title}</Text>
              {selectedMode === option.key && <Text style={styles.modeCardBadge}>{t.ready}</Text>}
            </View>
            <Text style={styles.modeCardDescription}>{option.description}</Text>
            <View style={styles.modeCardFooter}>
              <Text style={[styles.modeCardCTA, { color: option.accent }]}>{option.cta}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Button onPress={handlePlay} size="lg" fullWidth>
          <Text style={styles.playText}>{selectedMode === 'rapid' ? t.start_duel : t.play}</Text>
        </Button>
      </View>

      <ScrollView style={styles.socialList} contentContainerStyle={styles.socialContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.friends_online}</Text>
          <Text style={styles.sectionAction}>{t.see_all}</Text>
        </View>

        {MOCK_FRIENDS.map(friend => (
          <View key={friend.id} style={styles.friendRow}>
            <View style={styles.friendInfo}>
              <Image
                source={friend.avatar ? { uri: friend.avatar } : placeholderAvatar}
                style={styles.friendAvatar}
              />
              <View>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendStatus}>
                  {friend.status === 'In Game'
                    ? t.in_game
                    : friend.status === 'Online'
                    ? t.online
                    : t.offline}
                </Text>
              </View>
            </View>
            <Button size="sm" variant="outline" onPress={() => handleChallenge(friend.name, friend.countryCode, friend.avatar)}>
              <Text style={styles.challengeText}>{t.challenge}</Text>
            </Button>
          </View>
        ))}

        <View style={styles.sectionDivider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.random_encounters}</Text>
          <Text style={styles.sectionAction}>{t.refresh}</Text>
        </View>

        {MOCK_RANDOM_PLAYERS.map(player => (
          <View key={player.id} style={styles.randomRow}>
            <View style={styles.randomInfo}>
              <Image
                source={player.avatar ? { uri: player.avatar } : placeholderAvatar}
                style={styles.randomAvatar}
              />
              <View>
                <View style={styles.randomNameRow}>
                  <Text style={styles.randomName}>{player.name}</Text>
                  <Text style={styles.randomFlag}>{getFlagEmoji(player.countryCode) ?? '🏳️'}</Text>
                </View>
                <Text style={styles.randomMeta}>{`${player.mode} · ${player.timeAgo}`}</Text>
              </View>
            </View>
            <View style={styles.randomRight}>
              <Text style={styles.randomElo}>{player.elo} ELO</Text>
              <Button size="sm" variant="outline" onPress={() => handleChallenge(player.name, player.countryCode, player.avatar)}>
                <Text style={styles.challengeText}>{t.challenge}</Text>
              </Button>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  streakBadge: {
    backgroundColor: '#111827',
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
    color: '#9CA3AF',
    fontSize: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#111827',
    marginRight: 12,
  },
  languageText: {
    color: '#D4AF37',
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
    color: '#9CA3AF',
    fontSize: 12,
  },
  rankValue: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4AF37',
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
    color: '#D4AF37',
  },
  heroSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  modesSection: {
    marginBottom: 24,
    gap: 12,
  },
  modeCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  modeCardActive: {
    borderColor: '#FDE68A',
    shadowColor: '#FBBF24',
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
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  modeCardBadge: {
    color: '#FDE68A',
    fontWeight: '700',
    fontSize: 12,
  },
  modeCardDescription: {
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 12,
  },
  modeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeCardCTA: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  playText: {
    color: '#000000',
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
    color: '#9CA3AF',
    fontWeight: '700',
  },
  sectionAction: {
    color: '#D4AF37',
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
    backgroundColor: '#111827',
    marginVertical: 12,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#111827',
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
    color: '#FFFFFF',
    fontWeight: '700',
  },
  friendStatus: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  challengeText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
  },
  randomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#0B1120',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
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
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 6,
  },
  randomFlag: {
    fontSize: 16,
  },
  randomMeta: {
    color: '#94A3B8',
    fontSize: 12,
  },
  randomRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  randomElo: {
    color: '#FBBF24',
    fontWeight: '700',
  },
});
