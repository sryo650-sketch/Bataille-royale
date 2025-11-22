import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useThemeColor } from '../../contexts/ThemeContext';
import { getAvatarSource } from '../../utils/avatarUtils';

interface FriendRowProps {
  item: {
    id: string;
    name: string;
    status: 'In Game' | 'Online' | 'Offline';
    avatar?: string;
    onChallenge: () => void;
    onDuel: () => void;
  };
  index: number;
}

export const FriendRow = React.memo<FriendRowProps>(({ item, index }) => {
  const { t } = useLanguage();
  const colors = useThemeColor();

  const statusText = item.status === 'In Game'
    ? t.in_game
    : item.status === 'Online'
      ? t.online
      : t.offline;

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 70)}
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
          <Image source={getAvatarSource(item.avatar)} style={styles.avatar} />
          <View>
            <Text style={[styles.name, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.status, { color: colors.textSecondary }]}>
              {statusText}
            </Text>
          </View>
        </View>
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
    </Animated.View>
  );
});

FriendRow.displayName = 'FriendRow';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  name: {
    fontWeight: '700',
  },
  status: {
    fontSize: 12,
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
