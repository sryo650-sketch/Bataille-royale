import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useThemeColor } from '../../contexts/ThemeContext';
import { getFlagEmoji } from '../../utils/countryUtils';

interface RecentOpponentRowProps {
  item: {
    matchId: string;
    name: string;
    countryCode: string;
    result: 'WIN' | 'LOSS' | 'DRAW';
    date: string;
    onChallenge: () => void;
  };
  index: number;
}

export const RecentOpponentRow = React.memo<RecentOpponentRowProps>(({ item, index }) => {
  const { t, language } = useLanguage();
  const colors = useThemeColor();

  // ✅ formatDate créé localement - pas de prop fonction
  const formatDate = useCallback(
    (dateString: string) => {
      try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
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

  return (
    <Animated.View
      entering={FadeInDown.delay(150 + index * 70)}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceAlt,
          },
        ]}
      >
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>
            {item.name} {getFlagEmoji(item.countryCode) ?? '🏳️'}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
        </View>
        <View style={styles.actions}>
          <Text
            style={[
              styles.result,
              { 
                color: item.result === 'WIN' 
                  ? '#22C55E' 
                  : item.result === 'DRAW' 
                    ? '#F59E0B' 
                    : '#EF4444' 
              },
            ]}
          >
            {item.result === 'WIN' ? '✓' : item.result === 'DRAW' ? '=' : '✗'}
          </Text>
          <Button size="sm" variant="outline" onPress={item.onChallenge}>
            <Text style={[styles.challengeText, { color: colors.gold }]}>
              {t.challenge}
            </Text>
          </Button>
        </View>
      </View>
    </Animated.View>
  );
});

RecentOpponentRow.displayName = 'RecentOpponentRow';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  result: {
    fontSize: 20,
    fontWeight: '900',
  },
  challengeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
