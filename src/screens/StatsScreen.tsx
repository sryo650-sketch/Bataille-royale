import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserStats } from '../contexts/UserStatsContext';
import { getFlagEmoji } from '../utils/countryUtils';
import { Button } from '../components/Button';

interface StatsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { stats } = useUserStats();

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.wins / stats.gamesPlayed) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button size="sm" variant="ghost" onPress={() => onNavigate(Screen.HOME)}>
          <Text style={styles.backText}>{'<'} {t.return_menu}</Text>
        </Button>
        <Text style={styles.headerTitle}>{t.my_profile}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.rankCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>BR</Text>
            </View>
            <View style={styles.flagBadge}>
              <Text style={styles.flagText}>{getFlagEmoji(stats.countryCode)}</Text>
            </View>
          </View>
          <View style={styles.rankInfo}>
            <Text style={styles.rankLabel}>{t.current_rank}</Text>
            <Text style={styles.rankValue}>{stats.elo} ELO</Text>
            <Text style={styles.rankSub}>{t.top_percent}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t.win_rate}</Text>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statSub}>{t.success_rate}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t.games}</Text>
            <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
            <Text style={styles.statSub}>{t.games_played}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t.streak}</Text>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statSub}>{t.record}: {stats.bestStreak}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t.cards_won}</Text>
            <Text style={styles.statValue}>
              {stats.totalCardsWon > 1000
                ? (stats.totalCardsWon / 1000).toFixed(1) + 'k'
                : stats.totalCardsWon}
            </Text>
            <Text style={styles.statSub}>{t.cards_captured}</Text>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>{t.history}</Text>
          {stats.history.length === 0 ? (
            <Text style={styles.emptyHistory}>Aucun match joué pour le moment.</Text>
          ) : (
            stats.history.map(match => (
              <View key={match.id} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <View style={[styles.resultBar, {
                    backgroundColor: match.result === 'WIN' ? '#10B981' : '#EF4444',
                  }]} />
                  <View>
                    <Text style={styles.historyName}>
                      {match.opponentName} {getFlagEmoji(match.opponentCountry)}
                    </Text>
                    <Text style={styles.historyDate}>{match.date}</Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[styles.historyResult, {
                    color: match.result === 'WIN' ? '#22C55E' : '#F87171',
                  }]}>
                    {match.result === 'WIN' ? t.victory : t.defeat}
                  </Text>
                  <Text style={styles.historyScore}>
                    {match.scoreChange > 0 ? '+' : ''}{match.scoreChange} pts
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backText: {
    color: '#9CA3AF',
  },
  headerTitle: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  rankCard: {
    flexDirection: 'row',
    backgroundColor: '#030712',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  avatarWrapper: {
    marginRight: 16,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontWeight: '800',
    fontSize: 20,
  },
  flagBadge: {
    marginTop: 4,
  },
  flagText: {
    fontSize: 18,
  },
  rankInfo: {
    justifyContent: 'center',
  },
  rankLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  rankValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 24,
  },
  rankSub: {
    color: '#22C55E',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#030712',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 20,
  },
  statSub: {
    color: '#6B7280',
    fontSize: 12,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyHistory: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 8,
  },
  historyName: {
    color: '#E5E7EB',
    fontWeight: '600',
  },
  historyDate: {
    color: '#6B7280',
    fontSize: 12,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyResult: {
    fontWeight: '700',
  },
  historyScore: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});
