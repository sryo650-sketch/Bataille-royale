import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Button } from '../components/Button';
import { MOCK_FRIENDS } from '../constants';
import { Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserStats } from '../contexts/UserStatsContext';
import { getFlagEmoji } from '../utils/countryUtils';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { t, language, setLanguage } = useLanguage();
  const { stats } = useUserStats();
  const [gameMode, setGameMode] = useState<'friendly' | 'ranked'>('ranked');

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.streakBadge}>
          <Text style={styles.streakValue}>{stats.currentStreak}</Text>
          <Text style={styles.streakLabel}>{t.streak}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleLanguage} style={styles.languageToggle}>
            <Text style={styles.languageText}>{language.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate(Screen.STATS)} style={styles.profileWrapper}>
            <View style={styles.profileInfo}>
              <Text style={styles.rankLabel}>{t.rank_elo}</Text>
              <Text style={styles.rankValue}>{stats.elo}</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarFlag}>{getFlagEmoji(stats.countryCode)}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>BATAILLE</Text>
        <Text style={styles.heroSubtitle}>Edition Royale</Text>
      </View>

      <View style={styles.modesSection}>
        <View style={styles.modeRow}>
          <Button
            variant={gameMode === 'friendly' ? 'outline' : 'secondary'}
            size="md"
            fullWidth
            onPress={() => setGameMode('friendly')}
          >
            <Text style={gameMode === 'friendly' ? styles.modeActiveText : styles.modeInactiveText}>
              {t.friendly}
            </Text>
          </Button>
          <View style={styles.modeSpacer} />
          <Button
            variant={gameMode === 'ranked' ? 'outline' : 'secondary'}
            size="md"
            fullWidth
            onPress={() => setGameMode('ranked')}
          >
            <Text style={gameMode === 'ranked' ? styles.modeActiveText : styles.modeInactiveText}>
              {t.ranked}
            </Text>
          </Button>
        </View>

        <Button
          onPress={() => onNavigate(Screen.GAME)}
          size="lg"
          fullWidth
        >
          <Text style={styles.playText}>{t.play}</Text>
        </Button>
      </View>

      <View style={styles.friendsHeader}>
        <Text style={styles.friendsTitle}>{t.friends_online}</Text>
        <Text style={styles.friendsSeeAll}>{t.see_all}</Text>
      </View>

      <ScrollView style={styles.friendsList} contentContainerStyle={styles.friendsContent}>
        {MOCK_FRIENDS.map(friend => (
          <View key={friend.id} style={styles.friendRow}>
            <View style={styles.friendInfo}>
              <Image source={{ uri: friend.avatar }} style={styles.friendAvatar} />
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
            <Button size="sm" variant="outline">
              <Text style={styles.challengeText}>{t.challenge}</Text>
            </Button>
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
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modeSpacer: {
    width: 12,
  },
  modeActiveText: {
    color: '#FFFFFF',
  },
  modeInactiveText: {
    color: '#9CA3AF',
  },
  playText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 18,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  friendsTitle: {
    color: '#9CA3AF',
    fontWeight: '700',
  },
  friendsSeeAll: {
    color: '#D4AF37',
    fontSize: 12,
  },
  friendsList: {
    flex: 1,
  },
  friendsContent: {
    paddingBottom: 24,
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
});
