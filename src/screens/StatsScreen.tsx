import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Vibration } from 'react-native';
import { Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserStats } from '../contexts/UserStatsContext';
import { getFlagEmoji } from '../utils/countryUtils';
import { Button } from '../components/Button';
import { TierBadge } from '../components/TierBadge';
import { COUNTRY_LEADERBOARDS, GLOBAL_LEADERBOARD, LeaderboardEntry } from '../constants';

interface StatsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { stats } = useUserStats();

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.wins / stats.gamesPlayed) * 100)
    : 0;

  // Calcul du rang basé sur l'ELO (formule approximative)
  // 1500 ELO = ~50000e rang, 2000 ELO = ~1000e rang, 2500+ = top 100
  const estimatedRank = Math.max(1, Math.floor(Math.pow(10, 6 - (stats.elo / 500))));

  const countryLeaderboard: LeaderboardEntry[] =
    COUNTRY_LEADERBOARDS[stats.countryCode] ?? [];

  const vibrateSection = () => Vibration.vibrate(10);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          size="sm"
          variant="ghost"
          accessibilityLabel={t.return_menu}
          onPress={() => onNavigate(Screen.HOME)}
        >
          <Text style={styles.backText}>{'<'} {t.return_menu}</Text>
        </Button>
        <Text style={styles.headerTitle}>{t.my_profile}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.rankCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Image
                source={stats.avatar ? { uri: stats.avatar } : placeholderAvatar}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.flagBadge}>
              <Text style={styles.flagText}>{getFlagEmoji(stats.countryCode) ?? '🏳️'}</Text>
            </View>
          </View>
          <View style={styles.rankInfo}>
            <Text style={styles.rankLabel}>{t.current_rank}</Text>
            <TierBadge rank={estimatedRank} showRankNumber={true} />
            <Text style={styles.rankValue}>{stats.elo} ELO</Text>
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
          <TouchableOpacity onPress={vibrateSection} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>{t.history}</Text>
          </TouchableOpacity>
          {stats.history.length === 0 ? (
            <Text style={styles.emptyHistory}>{t.no_history ?? 'Aucun match joué pour le moment.'}</Text>
          ) : (
            stats.history.map(match => (
              <HistoryRow
                key={`${match.id}-${match.date}`}
                match={match}
                getFlagEmoji={getFlagEmoji}
                translation={t}
              />
            ))
          )}
        </View>

        <View style={styles.leaderboardSection}>
          <TouchableOpacity onPress={vibrateSection} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>{t.global_leaderboard}</Text>
          </TouchableOpacity>
          {GLOBAL_LEADERBOARD.map((entry, index) => (
            <View key={entry.id} style={styles.leaderboardRow}>
              <View style={styles.leaderboardLeft}>
                <View
                  style={[styles.rankBadge, {
                    backgroundColor: getRankColor(index),
                  }]}
                >
                  <Text style={styles.rankBadgeText}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardName}>
                    {entry.name} {getFlagEmoji(entry.countryCode)}
                  </Text>
                  <TierBadge rank={index + 1} showRankNumber={false} />
                </View>
              </View>
              <View style={styles.leaderboardRight}>
                <Text style={styles.leaderboardElo}>{entry.elo} ELO</Text>
                <Text style={[styles.trend, getTrendStyle(entry.trend)]}>
                  {getTrendLabel(entry.trend)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.leaderboardSection}>
          <TouchableOpacity onPress={vibrateSection} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>{t.country_leaderboard}</Text>
          </TouchableOpacity>
          {countryLeaderboard.length === 0 ? (
            <Text style={styles.emptyHistory}>{t.no_country_leaderboard}</Text>
          ) : (
            countryLeaderboard.map((entry, index) => (
              <View key={entry.id} style={styles.leaderboardRow}>
                <View style={styles.leaderboardLeft}>
                  <View
                    style={[styles.rankBadge, {
                      backgroundColor: getRankColor(index),
                    }]}
                  >
                    <Text style={styles.rankBadgeText}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>
                      {entry.name} {getFlagEmoji(entry.countryCode)}
                    </Text>
                    <TierBadge rank={index + 1} showRankNumber={false} />
                  </View>
                </View>
                <View style={styles.leaderboardRight}>
                  <Text style={styles.leaderboardElo}>{entry.elo} ELO</Text>
                  <Text style={[styles.trend, getTrendStyle(entry.trend)]}>
                    {getTrendLabel(entry.trend)}
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

const getTrendLabel = (trend: LeaderboardEntry['trend']) => {
  if (trend === 'up') {
    return '▲';
  }
  if (trend === 'down') {
    return '▼';
  }
  return '▬';
};

const getTrendStyle = (trend: LeaderboardEntry['trend']) => {
  if (trend === 'up') {
    return styles.trendUp;
  }
  if (trend === 'down') {
    return styles.trendDown;
  }
  return styles.trendSteady;
};

const getRankColor = (index: number) => {
  if (index === 0) {
    return '#FFD700';
  }
  if (index === 1) {
    return '#C0C0C0';
  }
  if (index === 2) {
    return '#CD7F32';
  }
  return '#111827';
};

const HistoryRow = memo(({
  match,
  getFlagEmoji: flagFn,
  translation,
}: {
  match: ReturnType<typeof useUserStats>['stats']['history'][number];
  getFlagEmoji: (code: string) => string;
  translation: ReturnType<typeof useLanguage>['t'];
}) => (
  <View style={styles.historyRow}>
    <View style={styles.historyLeft}>
      <View style={[styles.resultBar, {
        backgroundColor: match.result === 'WIN' ? theme.win : theme.loss,
      }]} />
      <View>
        <Text style={styles.historyName}>
          {match.opponentName} {flagFn(match.opponentCountry) ?? '🏳️'}
        </Text>
        <Text style={styles.historyDate}>{match.date}</Text>
      </View>
    </View>
    <View style={styles.historyRight}>
      <Text style={[styles.historyResult, {
        color: match.result === 'WIN' ? theme.win : theme.loss,
      }]}>
        {match.result === 'WIN' ? translation.victory : translation.defeat}
      </Text>
      <Text style={styles.historyScore}>
        {match.scoreChange > 0 ? '+' : ''}{match.scoreChange} pts
      </Text>
    </View>
  </View>
));

HistoryRow.displayName = 'HistoryRow';

const placeholderAvatar = require('../assets/placeholder.png');
const theme = {
  bg: '#020617',
  card: '#030712',
  primary: '#D4AF37',
  muted: '#9CA3AF',
  win: '#22C55E',
  loss: '#F87171',
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
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
    color: theme.muted,
  },
  headerTitle: {
    color: theme.primary,
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
    backgroundColor: theme.card,
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
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
    color: theme.muted,
    fontSize: 12,
  },
  rankValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 24,
  },
  rankSub: {
    color: theme.win,
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
    backgroundColor: theme.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  statLabel: {
    color: theme.muted,
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
  sectionTitle: {
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
    backgroundColor: theme.card,
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
  leaderboardSection: {
    marginTop: 24,
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankBadgeText: {
    color: '#000000',
    fontWeight: '700',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  leaderboardCountry: {
    color: theme.muted,
    fontSize: 12,
  },
  leaderboardRight: {
    alignItems: 'flex-end',
  },
  leaderboardElo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trend: {
    fontSize: 12,
    marginTop: 2,
  },
  trendUp: {
    color: '#22C55E',
  },
  trendDown: {
    color: '#F87171',
  },
  trendSteady: {
    color: '#9CA3AF',
  },
});
