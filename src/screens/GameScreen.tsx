import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Vibration, Animated, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CardData, GamePhase, Player, Screen } from '../types';
import { createDeck, shuffleDeck, splitDeck } from '../services/gameLogic';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserStats } from '../contexts/UserStatsContext';
import { getFlagEmoji, getRandomCountry } from '../utils/countryUtils';

const placeholderAvatar = require('../assets/placeholder.png');
const theme = {
  bg: '#020617',
  primary: '#D4AF37',
  textMuted: '#9CA3AF',
  surface: '#030712',
  win: '#22C55E',
  loss: '#F87171',
  battle: '#F97316',
} as const;

interface GameScreenProps {
  onNavigate: (screen: Screen) => void;
}

type MessageKey =
  | 'tap_start'
  | 'tap_card'
  | 'ready_fight'
  | 'duel_imminent'
  | 'round_won'
  | 'round_lost'
  | 'battle';

export const GameScreen: React.FC<GameScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { recordGame } = useUserStats();

  const [phase, setPhase] = useState<GamePhase>(GamePhase.WAITING);
  const [player, setPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [pot, setPot] = useState<CardData[]>([]);
  const [messageKey, setMessageKey] = useState<MessageKey>('tap_start');
  const [roundResult, setRoundResult] = useState<'WIN' | 'LOSS' | 'WAR' | null>(null);
  const [hasPeeked, setHasPeeked] = useState(false);

  const roundCountRef = useRef(0);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fullDeck = shuffleDeck(createDeck());
    const [p1Deck, p2Deck] = splitDeck(fullDeck);

    setPlayer({
      id: 'me',
      name: 'Toi',
      deck: p1Deck,
      isLocked: false,
      score: 0,
    });

    setOpponent({
      id: 'bot',
      name: 'Adversaire',
      deck: p2Deck,
      isLocked: false,
      score: 0,
      countryCode: getRandomCountry(),
    });

    roundCountRef.current = 0;
    prepareNextRound(p1Deck, p2Deck);
  }, []);

  useEffect(() => {
    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
      }
    };
  }, []);

  const prepareNextRound = (pDeck: CardData[], oDeck: CardData[]) => {
    if (pDeck.length === 0 || oDeck.length === 0) {
      endGame(pDeck.length > 0);
      return;
    }

    roundCountRef.current += 1;

    const pCard = pDeck[0];
    const oCard = oDeck[0];

    setPlayer(prev => (prev ? { ...prev, currentCard: pCard, isLocked: false } : null));
    setOpponent(prev => (prev ? { ...prev, currentCard: oCard, isLocked: false } : null));
    setRoundResult(null);
    setPhase(GamePhase.WAITING);
    setHasPeeked(false);
    setMessageKey('tap_card');

    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
    }
    const delay = Math.random() * 1500 + 500;
    botTimerRef.current = setTimeout(() => {
      setOpponent(prev => (prev ? { ...prev, isLocked: true } : null));
    }, delay);
  };

  const handlePlayerPeek = () => {
    if (phase === GamePhase.WAITING && !hasPeeked) {
      setHasPeeked(true);
      setMessageKey('ready_fight');
    }
  };

  const handlePlayerLock = () => {
    if (phase !== GamePhase.WAITING || !player) {
      return;
    }
    setPlayer({ ...player, isLocked: true });
  };

  useEffect(() => {
    if (phase === GamePhase.WAITING && player?.isLocked && opponent?.isLocked) {
      setPhase(GamePhase.LOCKED);
      setMessageKey('duel_imminent');

      setTimeout(() => {
        setPhase(GamePhase.REVEALING);
        setTimeout(() => {
          resolveRound();
        }, 1000);
      }, 600);
    }
  }, [player?.isLocked, opponent?.isLocked, phase]);

  const resolveRound = () => {
    if (!player?.currentCard || !opponent?.currentCard) {
      return;
    }

    setPhase(GamePhase.RESOLVING);

    const pVal = player.currentCard.rank;
    const oVal = opponent.currentCard.rank;

    if (pVal > oVal) {
      handleWin(true);
    } else if (oVal > pVal) {
      handleWin(false);
    } else {
      handleWar();
    }
  };

  const handleWin = (playerWon: boolean) => {
    Vibration.vibrate(50);
    setRoundResult(playerWon ? 'WIN' : 'LOSS');
    setMessageKey(playerWon ? 'round_won' : 'round_lost');

    setTimeout(() => {
      if (!player || !opponent || !player.currentCard || !opponent.currentCard) {
        return;
      }

      const wonCards = [player.currentCard, opponent.currentCard, ...pot];

      if (playerWon) {
        const newDeck = [...player.deck.slice(1), ...wonCards];
        const oppDeck = opponent.deck.slice(1);
        setPot([]);
        setPlayer(p => (p ? { ...p, deck: newDeck, score: p.score + wonCards.length } : null));
        setOpponent(o => (o ? { ...o, deck: oppDeck } : null));
        prepareNextRound(newDeck, oppDeck);
      } else {
        const newDeck = player.deck.slice(1);
        const oppDeck = [...opponent.deck.slice(1), ...wonCards];
        setPot([]);
        setPlayer(p => (p ? { ...p, deck: newDeck } : null));
        setOpponent(o => (o ? { ...o, deck: oppDeck, score: o.score + wonCards.length } : null));
        prepareNextRound(newDeck, oppDeck);
      }
    }, 1500);
  };

  const handleWar = () => {
    setRoundResult('WAR');
    setMessageKey('battle');
    setPhase(GamePhase.BATTLE);
    Vibration.vibrate(100);

    setTimeout(() => {
      if (!player || !opponent || !player.currentCard || !opponent.currentCard) {
        return;
      }

      const newPot = [...pot, player.currentCard, opponent.currentCard];
      const pDeck = player.deck;
      const oDeck = opponent.deck;

      if (pDeck.length < 2 || oDeck.length < 2) {
        const playerWins = pDeck.length > oDeck.length;
        endGame(playerWins);
        return;
      }

      const cardsToBurn = 3;
      const availableP = Math.max(0, pDeck.length - 2);
      const availableO = Math.max(0, oDeck.length - 2);
      const actualBurn = Math.min(cardsToBurn, availableP, availableO);

      for (let i = 1; i <= actualBurn; i += 1) {
        newPot.push(pDeck[i]);
        newPot.push(oDeck[i]);
      }

      setPot(newPot);

      const nextIndex = 1 + actualBurn;
      const pNextDeck = pDeck.slice(nextIndex);
      const oNextDeck = oDeck.slice(nextIndex);

      setPlayer(p => (p ? { ...p, deck: pNextDeck, isLocked: false } : null));
      setOpponent(o => (o ? { ...o, deck: oNextDeck, isLocked: false } : null));

      prepareNextRound(pNextDeck, oNextDeck);
    }, 2000);
  };

  const endGame = (didWin: boolean) => {
    setPhase(GamePhase.GAME_OVER);
    if (opponent) {
      recordGame(didWin ? 'WIN' : 'LOSS', opponent.name, opponent.countryCode || 'FR');
    }
  };

  const getStatusColor = () => {
    if (phase === GamePhase.BATTLE) {
      return styles.statusBattle;
    }
    if (roundResult === 'WIN') {
      return styles.statusWin;
    }
    if (roundResult === 'LOSS') {
      return styles.statusLoss;
    }
    return styles.statusDefault;
  };

  if (!player || !opponent) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (phase === GamePhase.GAME_OVER) {
    const didWin = player.deck.length > opponent.deck.length;
    return (
      <View style={styles.gameOverContainer}>
        <Text style={styles.gameOverEmoji}>{didWin ? '­ƒææ' : '­ƒÆÇ'}</Text>
        <Text style={styles.gameOverTitle}>{didWin ? t.victory : t.defeat}</Text>
        <Text style={styles.gameOverSubtitle}>{didWin ? t.won_all : t.lost_all}</Text>
        <View style={styles.gameOverCard}>
          <View style={styles.gameOverRow}>
            <Text style={styles.gameOverLabel}>Points ELO</Text>
            <Text style={[styles.gameOverValue, { color: didWin ? '#22C55E' : '#F87171' }]}>
              {didWin ? '+52' : '-26'}
            </Text>
          </View>
          <View style={styles.gameOverRow}>
            <Text style={styles.gameOverLabel}>Adversaire</Text>
            <Text style={styles.gameOverValue}>
              {opponent.name} {getFlagEmoji(opponent.countryCode || '') ?? '­ƒÅ│´©Å'}
            </Text>
          </View>
        </View>
        <Button onPress={() => onNavigate(Screen.HOME)}>
          <Text style={styles.backToMenuText}>{t.return_menu}</Text>
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t.return_menu}
          onPress={() => onNavigate(Screen.HOME)}
        >
          <Text style={styles.backText}>{'<'} Menu</Text>
        </TouchableOpacity>
        <Text style={[styles.statusText, getStatusColor()]}>{t[messageKey]}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.opponentSection}>
        <Image
          source={opponent.avatar ? { uri: opponent.avatar } : placeholderAvatar}
          style={styles.opponentAvatar}
        />
        <Text style={styles.opponentLabel}>
          {t.opponent} {getFlagEmoji(opponent.countryCode || '') ?? '­ƒÅ│´©Å'}
        </Text>
        <Text style={styles.deckCount}>Cartes: {opponent.deck.length}</Text>
        <Card
          card={opponent.currentCard}
          isFaceUp={
            phase === GamePhase.REVEALING ||
            phase === GamePhase.RESOLVING ||
            phase === GamePhase.BATTLE
          }
          isLosing={roundResult === 'WIN'}
          isWinning={roundResult === 'LOSS'}
        />
      </View>

      <View style={styles.potSection}>
        {pot.length > 0 && (
          <Text style={styles.potText}>
            {t.pot}: {pot.length}
          </Text>
        )}
      </View>

      <View style={styles.playerSection}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t.look_card}
          onPress={handlePlayerPeek}
          activeOpacity={0.7}
        >
          <Card
            card={player.currentCard}
            isFaceUp={hasPeeked || phase !== GamePhase.WAITING}
            isWinning={roundResult === 'WIN'}
            isLosing={roundResult === 'LOSS'}
          />
        </TouchableOpacity>
        <Text style={styles.deckCount}>Cartes: {player.deck.length}</Text>
        <Text style={styles.playerLabel}>{t.me}</Text>

        <View style={styles.controls}>
          {!hasPeeked ? (
            <Text style={styles.helperText}>
              {roundCountRef.current <= 2 ? t.look_card : t.your_turn}
            </Text>
          ) : !player.isLocked ? (
            <Button fullWidth onPress={handlePlayerLock}>
              <Text style={styles.fightText}>{t.fight}</Text>
            </Button>
          ) : (
            <Text style={styles.waitingText}>{t.waiting}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#E5E7EB',
  },
  statusText: {
    fontWeight: '700',
  },
  statusBattle: {
    color: theme.battle,
  },
  statusWin: {
    color: theme.win,
  },
  statusLoss: {
    color: theme.loss,
  },
  statusDefault: {
    color: theme.primary,
  },
  opponentSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  opponentAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  opponentLabel: {
    color: theme.textMuted,
    marginBottom: 4,
  },
  deckCount: {
    color: '#E5E7EB',
    marginBottom: 8,
  },
  potSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  potText: {
    color: theme.battle,
    fontWeight: '700',
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
  },
  playerLabel: {
    color: theme.primary,
    marginTop: 4,
  },
  controls: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  helperText: {
    color: theme.textMuted,
    textAlign: 'center',
  },
  fightText: {
    color: '#000000',
    fontWeight: '700',
  },
  waitingText: {
    color: theme.textMuted,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  loadingText: {
    color: '#E5E7EB',
  },
  gameOverContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
    paddingHorizontal: 24,
  },
  gameOverEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  gameOverTitle: {
    color: theme.primary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  gameOverSubtitle: {
    color: theme.textMuted,
    marginBottom: 16,
  },
  gameOverCard: {
    width: '100%',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  gameOverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gameOverLabel: {
    color: theme.textMuted,
  },
  gameOverValue: {
    color: '#E5E7EB',
    fontWeight: '700',
  },
  backToMenuText: {
    color: '#000000',
    fontWeight: '700',
  },
});
