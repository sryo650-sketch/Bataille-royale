import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '../theme';
import { PlayingCard, PlayingCardRank, PlayingCardSuit } from '../components/PlayingCard';
import { AnimatedCardWrapper } from '../components/AnimatedCardWrapper';
import { NavigationHandler, Screen } from '../types';

interface CombatScreenProps {
  onNavigate: NavigationHandler;
}

type Phase = 'ready' | 'reveal' | 'result';
type RoundResult = 'win' | 'lose' | 'draw';

interface SimpleCard {
  rank: PlayingCardRank;
  suit: PlayingCardSuit;
}

const ranks: PlayingCardRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits: PlayingCardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const rankStrength: Record<PlayingCardRank, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

const drawRandomCard = (): SimpleCard => ({
  rank: ranks[Math.floor(Math.random() * ranks.length)],
  suit: suits[Math.floor(Math.random() * suits.length)],
});

export const CombatScreen: React.FC<CombatScreenProps> = ({ onNavigate }) => {
  const [phase, setPhase] = useState<Phase>('ready');
  const [result, setResult] = useState<RoundResult | null>(null);
  const [opponentCard, setOpponentCard] = useState<SimpleCard | null>(null);
  const [yourCard, setYourCard] = useState<SimpleCard | null>(null);
  const [round, setRound] = useState(0);

  const resultFlash = useSharedValue(0);

  const subtitle = useMemo(() => {
    if (phase === 'ready') {
      return 'Prêt à combattre ?';
    }
    if (phase === 'reveal') {
      return 'Cartes révélées';
    }
    if (result === 'win') {
      return 'Victoire !';
    }
    if (result === 'lose') {
      return 'Manche perdue...';
    }
    if (result === 'draw') {
      return 'Égalité';
    }
    return 'Prêt à combattre ?';
  }, [phase, result]);

  const subtitleColor = useMemo(() => {
    if (result === 'win') return COLORS.gold;
    if (result === 'lose') return COLORS.red;
    return COLORS.primary;
  }, [result]);

  const triggerFlash = (outcome: RoundResult) => {
    if (outcome === 'draw') {
      resultFlash.value = 0;
      return;
    }
    resultFlash.value = 0;
    resultFlash.value = withSequence(
      withTiming(1, { duration: 140 }),
      withDelay(90, withTiming(0, { duration: 220 })),
    );
  };

  const evaluateRound = (opp: SimpleCard, you: SimpleCard): RoundResult => {
    const oppValue = rankStrength[opp.rank];
    const yourValue = rankStrength[you.rank];
    if (yourValue > oppValue) return 'win';
    if (yourValue < oppValue) return 'lose';
    return 'draw';
  };

  const handleCombat = useCallback(() => {
    if (phase === 'reveal') {
      return;
    }

    const opponent = drawRandomCard();
    const player = drawRandomCard();

    setOpponentCard(opponent);
    setYourCard(player);
    setPhase('reveal');
    setResult(null);
    setRound(r => r + 1);

    const outcome = evaluateRound(opponent, player);

    setTimeout(() => {
      setResult(outcome);
      setPhase('result');
      triggerFlash(outcome);
    }, 280);
  }, [phase]);

  const handleReset = () => {
    setPhase('ready');
    setResult(null);
    setOpponentCard(null);
    setYourCard(null);
  };

  const handlePrimaryAction = () => {
    if (phase === 'result') {
      handleReset();
      return;
    }
    handleCombat();
  };

  const flashStyle = useAnimatedStyle(() => {
    'worklet';
    let backgroundColor = 'transparent';
    if (result === 'win') {
      backgroundColor = 'rgba(230,193,90,0.28)';
    } else if (result === 'lose') {
      backgroundColor = 'rgba(217,59,72,0.25)';
    }
    return {
      ...StyleSheet.absoluteFillObject,
      backgroundColor,
      opacity: resultFlash.value,
    };
  }, [result]);

  const showOpponentBack = phase === 'ready' || !opponentCard;
  const showPlayerBack = phase === 'ready' || !yourCard;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={flashStyle} pointerEvents="none" />
      <View style={styles.content}>
        <TouchableOpacity style={styles.menu} onPress={() => onNavigate(Screen.HOME)}>
          <Text style={styles.menuText}>{'< Menu'}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Classique</Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>

        <View style={styles.cardSection}>
          <AnimatedCardWrapper trigger={round}>
            {showOpponentBack ? (
              <PlayingCard variant="back" widthRatio={0.55} />
            ) : (
              <PlayingCard
                rank={opponentCard.rank}
                suit={opponentCard.suit}
                highlighted={result === 'lose'}
                widthRatio={0.55}
              />
            )}
          </AnimatedCardWrapper>
        </View>
        <Text style={styles.infoText}>Adversaire</Text>

        <View style={styles.cardSection}>
          <AnimatedCardWrapper trigger={round}>
            {showPlayerBack ? (
              <PlayingCard variant="back" widthRatio={0.55} />
            ) : (
              <PlayingCard
                rank={yourCard.rank}
                suit={yourCard.suit}
                highlighted={result === 'win'}
                widthRatio={0.55}
              />
            )}
          </AnimatedCardWrapper>
        </View>
        <Text style={styles.infoText}>Toi</Text>

        {phase !== 'reveal' && (
          <TouchableOpacity style={styles.button} onPress={handlePrimaryAction} activeOpacity={0.85}>
            <Text style={styles.buttonText}>{phase === 'ready' ? 'COMBATTRE' : 'CONTINUER'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  menu: {
    alignSelf: 'flex-start',
    marginTop: SPACING.m,
  },
  menuText: {
    color: COLORS.white,
    fontSize: 16,
  },
  title: {
    marginTop: SPACING.m,
    fontSize: 18,
    color: COLORS.white,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
  },
  cardSection: {
    marginTop: SPACING.l,
    marginBottom: SPACING.s,
  },
  infoText: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },
  button: {
    marginTop: SPACING.l,
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 40,
  },
  buttonText: {
    color: COLORS.black,
    fontWeight: '700',
    fontSize: 18,
  },
});
