import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Image, Animated } from 'react-native';
import { CardData, Suit, Rank } from '../types';
import { SUIT_COLORS, RANK_LABELS } from '../constants';

const cardBack = require('../../assets/back_002.png');

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

  const rotation = useRef(new Animated.Value(isFaceUp ? 0 : 180)).current;
  const suitColor = getSuitColor(card.suit);

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isFaceUp ? 0 : 180,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [isFaceUp, rotation]);

  const frontAnimatedStyle = {
    opacity: rotation.interpolate({
      inputRange: [0, 89, 90],
      outputRange: [1, 1, 0],
    }),
    transform: [
      { perspective: 800 },
      {
        rotateY: rotation.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] }),
      },
    ],
  } as const;

  const backAnimatedStyle = {
    opacity: rotation.interpolate({
      inputRange: [90, 91, 180],
      outputRange: [0, 1, 1],
    }),
    transform: [
      { perspective: 800 },
      {
        rotateY: rotation.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] }),
      },
    ],
  } as const;

  return (
    <View style={[styles.card, sizeStyle, { borderColor }, style]}>
      <Animated.View style={[styles.face, styles.faceFront, frontAnimatedStyle]}>
        <View style={styles.frontSurface}>
          <View style={styles.content}>
            <View style={styles.cornerTop}>
              <Text style={[styles.rank, { color: suitColor }]}>
                {getRankLabel(card.rank)}
              </Text>
              <Text style={[styles.suitSmall, { color: suitColor }]}>
                {card.suit}
              </Text>
            </View>
            <View style={styles.center}>
              <Text style={[styles.suitBig, { color: suitColor }]}>
                {card.suit}
              </Text>
            </View>
            <View style={styles.cornerBottom}>
              <Text style={[styles.rank, { color: suitColor }]}>
                {getRankLabel(card.rank)}
              </Text>
              <Text style={[styles.suitSmall, { color: suitColor }]}>
                {card.suit}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
      <Animated.View style={[styles.face, styles.faceBack, backAnimatedStyle]}>
        <View style={styles.backFrame}>
          <View style={styles.backContent}>
            <Image source={cardBack} style={styles.backImage} resizeMode="cover" />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const getRankLabel = (rank: Rank): string => {
  return RANK_LABELS[rank];
};

const getSuitColor = (suit: Suit) => {
  if (suit === Suit.CLUBS || suit === Suit.SPADES) {
    return '#111827';
  }
  return SUIT_COLORS[suit];
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0C1120',
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
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
    borderRadius: 16,
  },
  faceFront: {
    padding: 6,
    backgroundColor: 'transparent',
  },
  faceBack: {
    padding: 6,
  },
  frontSurface: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    padding: 8,
  },
  content: {
    flex: 1,
  },
  backFrame: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 6,
    backgroundColor: '#0C1120',
    borderRadius: 14,
  },
  backContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  backImage: {
    width: '100%',
    height: '100%',
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
