import React from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { COLORS, CARD, SPACING } from '../theme';

export type PlayingCardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type PlayingCardRank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export type PlayingCardVariant = 'front' | 'back';

export interface PlayingCardProps {
  rank?: PlayingCardRank;
  suit?: PlayingCardSuit;
  variant?: PlayingCardVariant;
  highlighted?: boolean;
  widthRatio?: number;
  style?: ViewStyle;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PlayingCardComponent: React.FC<PlayingCardProps> = ({
  rank = 'A',
  suit = 'spades',
  variant = 'front',
  highlighted = false,
  widthRatio = 0.65,
  style,
}) => {
  const cardWidth = SCREEN_WIDTH * widthRatio;
  const cardHeight = cardWidth * CARD.ratio;

  const isRed = suit === 'hearts' || suit === 'diamonds';
  const rankColor = isRed ? COLORS.red : COLORS.primary;
  const suitSymbol = getSuitSymbol(suit);

  const baseStyle = [
    styles.cardBase,
    {
      width: cardWidth,
      height: cardHeight,
      borderColor: highlighted ? COLORS.gold : COLORS.border,
    },
    highlighted && styles.highlighted,
    style,
  ];

  if (variant === 'back') {
    return (
      <View style={baseStyle}>
        <View style={styles.cardBackInner}>
          <View style={styles.patternGrid}>
            {Array.from({ length: 16 }).map((_, index) => (
              <View key={`dot-${index}`} style={styles.patternDot} />
            ))}
          </View>
          <View style={styles.scepterContainer}>
            <View style={styles.scepterStick} />
            <View style={styles.scepterHead} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={baseStyle}>
      <View style={styles.cornerTopLeft}>
        <Text style={[styles.rankText, { color: rankColor }]}>{rank}</Text>
        <Text style={[styles.suitText, { color: rankColor }]}>{suitSymbol}</Text>
      </View>

      <View style={styles.cornerBottomRight}>
        <Text style={[styles.rankText, { color: rankColor }]}>{rank}</Text>
        <Text style={[styles.suitText, { color: rankColor }]}>{suitSymbol}</Text>
      </View>

      <View style={styles.centerContent}>{renderCenter(rank, suit, rankColor)}</View>
    </View>
  );
};

const getSuitSymbol = (suit: PlayingCardSuit) => {
  switch (suit) {
    case 'hearts':
      return '♥';
    case 'diamonds':
      return '♦';
    case 'clubs':
      return '♣';
    case 'spades':
    default:
      return '♠';
  }
};

const renderCenter = (rank: PlayingCardRank, suit: PlayingCardSuit, color: string) => {
  if (rank === 'J' || rank === 'Q' || rank === 'K') {
    return (
      <View style={styles.faceContainer}>
        <View style={[styles.faceCircle, { borderColor: color }]} />
        <View style={[styles.faceBody, { borderColor: color }]} />
        <View
          style={[
            styles.faceBand,
            {
              backgroundColor: suit === 'hearts' || suit === 'diamonds' ? COLORS.gold : COLORS.primary,
            },
          ]}
        />
      </View>
    );
  }

  const pipCount = getPipCount(rank);
  return (
    <View style={styles.pipsContainer}>
      {Array.from({ length: pipCount }).map((_, index) => (
        <View key={`pip-${index}`} style={[styles.pip, { backgroundColor: color }]} />
      ))}
    </View>
  );
};

const getPipCount = (rank: PlayingCardRank): number => {
  if (rank === 'A') {
    return 1;
  }
  if (rank === 'J' || rank === 'Q' || rank === 'K') {
    return 0;
  }
  const parsed = parseInt(rank, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: COLORS.white,
    borderWidth: CARD.borderWidth,
    borderRadius: CARD.borderRadius,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  highlighted: {
    shadowOpacity: 0.6,
  },
  cardBackInner: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.m,
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  patternDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    margin: 4,
  },
  scepterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scepterStick: {
    width: 8,
    height: 80,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },
  scepterHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    position: 'absolute',
    top: -18,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: SPACING.s,
    left: SPACING.s,
    alignItems: 'flex-start',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: SPACING.s,
    right: SPACING.s,
    alignItems: 'flex-end',
    transform: [{ rotate: '180deg' }],
  },
  rankText: {
    fontFamily: 'Inter-Black',
    fontSize: 24,
  },
  suitText: {
    fontSize: 22,
    marginTop: -4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  faceContainer: {
    width: '55%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    marginBottom: 4,
  },
  faceBody: {
    width: '80%',
    height: 60,
    borderRadius: 20,
    borderWidth: 3,
  },
  faceBand: {
    position: 'absolute',
    width: '90%',
    height: 10,
    borderRadius: 5,
  },
  pipsContainer: {
    width: '70%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
  pip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    margin: 4,
  },
});

export const PlayingCard = React.memo(PlayingCardComponent);
PlayingCard.displayName = 'PlayingCard';
