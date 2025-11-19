import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { CardData, Suit, Rank } from '../types';
import { SUIT_COLORS, RANK_LABELS } from '../constants';

interface CardProps {
  card?: CardData;
  isFaceUp: boolean;
  isWinning?: boolean;
  isLosing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  card,
  isFaceUp,
  isWinning,
  isLosing,
  size = 'lg',
  style,
}) => {
  const sizeStyle = size === 'sm' ? styles.sm : size === 'md' ? styles.md : styles.lg;

  if (!card) {
    return <View style={[styles.placeholder, sizeStyle, style]} />;
  }

  const borderColor = isWinning
    ? '#10B981'
    : isLosing
    ? '#EF4444'
    : '#D4AF37';

  const backgroundColor = isFaceUp ? '#111827' : '#1F2933';

  return (
    <View style={[styles.card, sizeStyle, { borderColor, backgroundColor }, style]}>
      {isFaceUp ? (
        <View style={styles.content}>
          <View style={styles.cornerTop}>
            <Text style={[styles.rank, { color: SUIT_COLORS[card.suit] }]}>
              {getRankLabel(card.rank)}
            </Text>
            <Text style={[styles.suitSmall, { color: SUIT_COLORS[card.suit] }]}>
              {card.suit}
            </Text>
          </View>
          <View style={styles.center}>
            <Text style={[styles.suitBig, { color: SUIT_COLORS[card.suit] }]}>
              {card.suit}
            </Text>
          </View>
          <View style={styles.cornerBottom}>
            <Text style={[styles.rank, { color: SUIT_COLORS[card.suit] }]}>
              {getRankLabel(card.rank)}
            </Text>
            <Text style={[styles.suitSmall, { color: SUIT_COLORS[card.suit] }]}>
              {card.suit}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.backContent}>
          <Text style={styles.backText}>♛</Text>
        </View>
      )}
    </View>
  );
};

const getRankLabel = (rank: Rank): string => {
  return RANK_LABELS[rank];
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 8,
  },
  sm: {
    width: 64,
    height: 96,
  },
  md: {
    width: 96,
    height: 144,
  },
  lg: {
    width: 128,
    height: 192,
  },
  placeholder: {
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  backContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 32,
    color: '#D4AF37',
  },
  cornerTop: {
    position: 'absolute',
    top: 8,
    left: 8,
    alignItems: 'center',
  },
  cornerBottom: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  rank: {
    fontWeight: '700',
  },
  suitSmall: {
    fontSize: 12,
  },
  suitBig: {
    fontSize: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
