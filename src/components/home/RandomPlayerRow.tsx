import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useThemeColor } from '../../contexts/ThemeContext';
import { getFlagEmoji } from '../../utils/countryUtils';
import { getAvatarSource } from '../../utils/avatarUtils';

interface RandomPlayerRowProps {
  item: {
    id: string;
    name: string;
    mode: string;
    timeAgo: string;
    elo: number;
    avatar?: string;
    countryCode: string;
    onChallenge: () => void;
    onDuel: () => void;
  };
  index: number;
}

export const RandomPlayerRow = React.memo<RandomPlayerRowProps>(({ item, index }) => {
  const { t } = useLanguage();
  const colors = useThemeColor();

  return (
    <Animated.View
      entering={FadeInDown.delay(400 + index * 70)}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.surfaceAlt,
          },
        ]}
      >
        <View style={styles.info}>
          <Image source={getAvatarSource(item.avatar)} style={styles.avatar} />
          <View>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={styles.flag}>
                {getFlagEmoji(item.countryCode) ?? '🏳️'}
              </Text>
            </View>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {`${item.mode} · ${item.timeAgo}`}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={[styles.elo, { color: colors.gold }]}>
            {item.elo} ELO
          </Text>
          <View style={styles.actions}>
            <Button size="sm" variant="outline" onPress={item.onDuel}>
              <Text style={styles.duelText}>{t.duel}</Text>
            </Button>
            <Button size="sm" variant="outline" onPress={item.onChallenge}>
              <Text style={[styles.challengeText, { color: colors.gold }]}>
                {t.challenge}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

RandomPlayerRow.displayName = 'RandomPlayerRow';

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
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
    marginRight: 6,
  },
  flag: {
    fontSize: 16,
  },
  meta: {
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  elo: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  duelText: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '700',
  },
  challengeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
