import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Vibration, Platform, Dimensions, Animated as RNAnimated } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AnimatedCardWrapper } from '../components/AnimatedCardWrapper';
import { SwordClash } from '../components/SwordClash';
import { HealthBar } from '../components/HealthBar';
import { SpecialCharges } from '../components/SpecialCharges';
import { ShieldIcon } from '../components/ShieldIcon';
import { SwordIcon } from '../components/SwordIcon';
import { CardData, GameConfig, GamePhase, Player, Screen, NavigationHandler } from '../types';
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

const RAPID_MODE_DURATION = 180;

const formatSeconds = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

interface GameScreenProps {
  onNavigate: NavigationHandler;
  gameConfig?: GameConfig;
}

type MessageKey =
  | 'tap_start'
  | 'ready_fight'
  | 'duel_imminent'
  | 'round_won'
  | 'round_lost'
  | 'battle';

export const GameScreen: React.FC<GameScreenProps> = ({ onNavigate, gameConfig }) => {
  const mode = gameConfig?.mode ?? 'classic';
  const isRankedMode = mode === 'classic';
  const isRapidMode = mode === 'rapid';
  const { t } = useLanguage();
  const { recordGame, stats, updateProfile } = useUserStats();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<GamePhase>(GamePhase.WAITING);
  const [player, setPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [pot, setPot] = useState<CardData[]>([]);
  const [messageKey, setMessageKey] = useState<MessageKey>('tap_start');
  const [roundResult, setRoundResult] = useState<'WIN' | 'LOSS' | 'WAR' | null>(null);
  const [hasPeeked, setHasPeeked] = useState(false);
  const [showSwordClash, setShowSwordClash] = useState(false);
  const [showSurrenderDialog, setShowSurrenderDialog] = useState(false);
  const [rapidTimeLeft, setRapidTimeLeft] = useState(RAPID_MODE_DURATION);
  
  // Système d'attaques spéciales
  const [playerSpecialCharges, setPlayerSpecialCharges] = useState(0);
  const [opponentSpecialCharges, setOpponentSpecialCharges] = useState(0);
  const [playerWinCount, setPlayerWinCount] = useState(0); // Total wins, pas streak
  const [opponentWinCount, setOpponentWinCount] = useState(0);
  const [playerUsingSpecial, setPlayerUsingSpecial] = useState<'attack' | 'defense' | null>(null);
  const [opponentUsingSpecial, setOpponentUsingSpecial] = useState<'attack' | 'defense' | null>(null);

  const roundCountRef = useRef(0);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rapidTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerDeckCountRef = useRef(0);
  const opponentDeckCountRef = useRef(0);
  const rapidTimeoutRef = useRef<() => void>(() => {});
  const totalRoundsPlayedRef = useRef(0);
  const playerActiveRoundsRef = useRef(0);
  const gameInitializedRef = useRef(false);
  
  // Timer par round (mode Rapid uniquement)
  const [roundTimeLeft, setRoundTimeLeft] = useState(10); // 10 secondes par round
  const [defeatReason, setDefeatReason] = useState<'normal' | 'inactivity'>('normal');

  const endGame = useCallback(
    (didWin: boolean) => {
      setPhase(GamePhase.GAME_OVER);
      // Ne pas enregistrer les stats en mode Rapid (pas de points ELO)
      if (opponent && !isRapidMode) {
        recordGame(didWin ? 'WIN' : 'LOSS', opponent.name, opponent.countryCode || 'FR');
      }
    },
    [opponent, recordGame, isRapidMode]
  );

  useEffect(() => {
    playerDeckCountRef.current = player?.deck.length ?? 0;
  }, [player?.deck.length ?? 0]);

  useEffect(() => {
    opponentDeckCountRef.current = opponent?.deck.length ?? 0;
  }, [opponent?.deck.length ?? 0]);

  useEffect(() => {
    rapidTimeoutRef.current = () => {
      if (phase === GamePhase.GAME_OVER) {
        return;
      }
      // Si les joueurs sont en train de jouer activement, on ne termine pas
      // Le timer ne fait perdre que si le joueur est AFK (ne joue pas)
      if (phase === GamePhase.WAITING || phase === GamePhase.LOCKED || 
          phase === GamePhase.REVEALING || phase === GamePhase.RESOLVING || 
          phase === GamePhase.BATTLE) {
        // Les joueurs jouent activement, on continue
        return;
      }
      
      // Calculer le taux d'activité du joueur
      const totalRounds = totalRoundsPlayedRef.current;
      const activeRounds = playerActiveRoundsRef.current;
      const activityRate = totalRounds > 0 ? (activeRounds / totalRounds) * 100 : 0;
      
      // Si le taux d'activité est faible (<50%), c'est une défaite par inactivité
      if (activityRate < 50) {
        setDefeatReason('inactivity');
      }
      
      const playerCount = playerDeckCountRef.current;
      const opponentCount = opponentDeckCountRef.current;
      const didWin = playerCount >= opponentCount;
      endGame(didWin);
    };
  }, [endGame, phase]);

  useEffect(() => {
    if (!isRapidMode) {
      setRapidTimeLeft(RAPID_MODE_DURATION);
      if (rapidTimerRef.current) {
        clearInterval(rapidTimerRef.current);
        rapidTimerRef.current = null;
      }
      return;
    }

    setRapidTimeLeft(RAPID_MODE_DURATION);
    if (rapidTimerRef.current) {
      clearInterval(rapidTimerRef.current);
    }

    rapidTimerRef.current = setInterval(() => {
      setRapidTimeLeft(prev => {
        if (prev <= 1) {
          if (rapidTimerRef.current) {
            clearInterval(rapidTimerRef.current);
            rapidTimerRef.current = null;
          }
          rapidTimeoutRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (rapidTimerRef.current) {
        clearInterval(rapidTimerRef.current);
        rapidTimerRef.current = null;
      }
    };
  }, [isRapidMode]);

  useEffect(() => {
    if (phase === GamePhase.GAME_OVER && rapidTimerRef.current) {
      clearInterval(rapidTimerRef.current);
      rapidTimerRef.current = null;
    }
  }, [phase]);

  // Screen shake animation
  const shakeTranslateX = useSharedValue(0);

  const triggerShake = () => {
    shakeTranslateX.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }],
  }));

  useEffect(() => {
    // Ne réinitialiser qu'une seule fois au montage du composant
    // Éviter les réinitialisations multiples en cours de partie
    if (gameInitializedRef.current) {
      return;
    }
    
    gameInitializedRef.current = true;
    
    const fullDeck = shuffleDeck(createDeck());
    const [p1Deck, p2Deck] = splitDeck(fullDeck);

    setPlayer({
      id: 'me',
      name: 'Toi',
      deck: p1Deck,
      isLocked: false,
      score: 0,
    });

    // Utiliser l'adversaire fourni dans gameConfig ou créer un bot
    const opponentData = gameConfig?.opponent || {
      id: 'bot',
      name: 'Adversaire',
      countryCode: getRandomCountry(),
    };

    setOpponent({
      ...opponentData,
      deck: p2Deck,
      isLocked: false,
      score: 0,
    });

    // En mode Rapid, activer 3 charges pour chaque joueur dès le début
    if (isRapidMode) {
      setPlayerSpecialCharges(3);
      setOpponentSpecialCharges(3);
    } else {
      // Réinitialiser les charges en mode Classic
      setPlayerSpecialCharges(0);
      setOpponentSpecialCharges(0);
    }

    roundCountRef.current = 0;
    totalRoundsPlayedRef.current = 0;
    playerActiveRoundsRef.current = 0;
    setDefeatReason('normal');
    
    prepareNextRound(p1Deck, p2Deck);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
      }
      if (roundTimerRef.current) {
        clearInterval(roundTimerRef.current);
      }
    };
  }, []);

  const prepareNextRound = (pDeck: CardData[], oDeck: CardData[]) => {
    if (pDeck.length === 0 || oDeck.length === 0) {
      endGame(pDeck.length > 0);
      return;
    }

    roundCountRef.current += 1;
    
    // Tracker le nombre total de rounds en mode Rapid
    if (isRapidMode) {
      totalRoundsPlayedRef.current += 1;
    }

    const pCard = pDeck[0];
    const oCard = oDeck[0];

    setPlayer(prev => (prev ? { ...prev, currentCard: pCard, isLocked: false } : null));
    setOpponent(prev => (prev ? { ...prev, currentCard: oCard, isLocked: false } : null));
    setRoundResult(null);
    setPhase(GamePhase.WAITING);
    setHasPeeked(false);
    setMessageKey('ready_fight');

    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
    }
    
    // IA du bot pour les charges spéciales en mode Rapid
    if (isRapidMode && opponentSpecialCharges > 0 && opponent?.currentCard) {
      const botCardRank = opponent.currentCard.rank;
      const shouldUseSpecial = decideBotSpecialMove(botCardRank, opponentSpecialCharges, playerSpecialCharges);
      
      if (shouldUseSpecial) {
        setOpponentUsingSpecial(shouldUseSpecial);
        setOpponentSpecialCharges(prev => prev - 1);
      }
    }
    
    const delay = Math.random() * 1500 + 500;
    botTimerRef.current = setTimeout(() => {
      setOpponent(prev => (prev ? { ...prev, isLocked: true } : null));
    }, delay);
  };
  
  // Logique d'IA pour le bot
  const decideBotSpecialMove = (
    botCardRank: number, 
    botCharges: number, 
    playerCharges: number
  ): 'attack' | 'defense' | null => {
    // Ne pas utiliser si pas de charges
    if (botCharges === 0) return null;
    
    // Stratégie : garder au moins 1 charge en réserve si possible
    const shouldKeepReserve = botCharges === 1 && Math.random() > 0.3;
    if (shouldKeepReserve) return null;
    
    // Si le joueur a des charges, risque d'attaque : 40% de chance de défendre
    if (playerCharges > 0 && Math.random() < 0.4) {
      return 'defense';
    }
    
    // Si carte faible (< 8), 60% de chance d'attaquer
    if (botCardRank < 8 && Math.random() < 0.6) {
      return 'attack';
    }
    
    // Si carte moyenne (8-11), 30% de chance d'attaquer
    if (botCardRank >= 8 && botCardRank < 11 && Math.random() < 0.3) {
      return 'attack';
    }
    
    // Si carte forte (>= 11), garder les charges (sauf 10% de chance de défendre)
    if (botCardRank >= 11 && Math.random() < 0.1) {
      return 'defense';
    }
    
    return null;
  };

  const handlePlayerPeek = () => {
    if (phase === GamePhase.WAITING && !hasPeeked) {
      setHasPeeked(true);
      setMessageKey('ready_fight');
      
      // Démarrer le timer par round en mode Rapid
      if (isRapidMode) {
        setRoundTimeLeft(10);
        if (roundTimerRef.current) {
          clearInterval(roundTimerRef.current);
        }
        roundTimerRef.current = setInterval(() => {
          setRoundTimeLeft(prev => {
            if (prev <= 1) {
              // Temps écoulé : le joueur perd automatiquement le round
              if (roundTimerRef.current) {
                clearInterval(roundTimerRef.current);
                roundTimerRef.current = null;
              }
              // Force le lock et fait perdre le joueur
              handlePlayerLock();
              setTimeout(() => {
                if (phase === GamePhase.WAITING) {
                  handleWin(false); // Le joueur perd
                }
              }, 100);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const handlePlayerLock = () => {
    if (phase !== GamePhase.WAITING || !player) {
      return;
    }
    setPlayer({ ...player, isLocked: true });
    
    // Tracker l'activité du joueur
    if (isRapidMode) {
      playerActiveRoundsRef.current += 1;
    }
    
    // Arrêter le timer du round
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
  };

  const handleUseAttack = () => {
    if (playerSpecialCharges > 0 && !playerUsingSpecial) {
      setPlayerUsingSpecial('attack');
      setPlayerSpecialCharges(prev => prev - 1);
      Vibration.vibrate(100);
    }
  };

  const handleUseDefense = () => {
    if (playerSpecialCharges > 0 && !playerUsingSpecial) {
      setPlayerUsingSpecial('defense');
      setPlayerSpecialCharges(prev => prev - 1);
      Vibration.vibrate(100);
    }
  };

  useEffect(() => {
    if (phase === GamePhase.WAITING && player?.isLocked && opponent?.isLocked) {
      setPhase(GamePhase.LOCKED);
      setMessageKey('duel_imminent');

      setTimeout(() => {
        setPhase(GamePhase.REVEALING);
        setTimeout(() => {
          resolveRound();
        }, 400); // Réduit de 1000ms à 400ms
      }, 300); // Réduit de 600ms à 300ms
    }
  }, [player?.isLocked, opponent?.isLocked, phase]);

  const resolveRound = () => {
    if (!player?.currentCard || !opponent?.currentCard) {
      return;
    }

    setPhase(GamePhase.RESOLVING);

    // Gestion des attaques spéciales
    
    // CAS 1 : Les deux utilisent l'épée → DESTRUCTION MUTUELLE
    if (playerUsingSpecial === 'attack' && opponentUsingSpecial === 'attack') {
      setMessageKey('battle');
      Vibration.vibrate([0, 300, 100, 300]);
      setRoundResult('WAR'); // Affichage visuel de clash
      
      setTimeout(() => {
        // Les deux cartes sont détruites, personne ne gagne
        const newPlayerDeck = player.deck.slice(1);
        const newOpponentDeck = opponent.deck.slice(1);
        setPot([]); // Pas de pot, les cartes sont détruites
        
        setPlayer(p => (p ? { ...p, deck: newPlayerDeck } : null));
        setOpponent(o => (o ? { ...o, deck: newOpponentDeck } : null));
        setPlayerUsingSpecial(null);
        setOpponentUsingSpecial(null);
        
        prepareNextRound(newPlayerDeck, newOpponentDeck);
      }, 800);
      return;
    }
    
    // CAS 2 : Joueur attaque, adversaire ne défend pas → VICTOIRE INSTANTANÉE
    if (playerUsingSpecial === 'attack' && opponentUsingSpecial !== 'defense') {
      setMessageKey('battle');
      Vibration.vibrate([0, 200, 100, 200]);
      handleWin(true);
      setPlayerUsingSpecial(null);
      setOpponentUsingSpecial(null);
      return;
    }
    
    // CAS 3 : Adversaire attaque, joueur ne défend pas → DÉFAITE INSTANTANÉE
    if (opponentUsingSpecial === 'attack' && playerUsingSpecial !== 'defense') {
      setMessageKey('battle');
      Vibration.vibrate([0, 200, 100, 200]);
      handleWin(false);
      setPlayerUsingSpecial(null);
      setOpponentUsingSpecial(null);
      return;
    }
    
    // CAS 4 : Défense neutralise attaque → ROUND NORMAL
    if ((playerUsingSpecial === 'attack' && opponentUsingSpecial === 'defense') ||
        (opponentUsingSpecial === 'attack' && playerUsingSpecial === 'defense')) {
      // Neutralisation : round normal
      setPlayerUsingSpecial(null);
      setOpponentUsingSpecial(null);
    }

    // Round normal avec comparaison de cartes
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

    // Gestion des victoires et charges spéciales (UNIQUEMENT en mode Classic)
    if (playerWon) {
      const newWinCount = playerWinCount + 1;
      setPlayerWinCount(newWinCount);
      
      // Déblocage d'une charge tous les 3 wins (max 3) - UNIQUEMENT en mode Classic
      if (!isRapidMode && newWinCount % 3 === 0 && playerSpecialCharges < 3) {
        setPlayerSpecialCharges(prev => Math.min(prev + 1, 3));
        // Incrémenter le compteur total de charges
        updateProfile({ totalChargesEarned: (stats.totalChargesEarned || 0) + 1 });
        Vibration.vibrate([0, 100, 50, 100]); // Vibration spéciale
      }
    } else {
      const newWinCount = opponentWinCount + 1;
      setOpponentWinCount(newWinCount);
      
      // L'adversaire peut aussi débloquer des charges - UNIQUEMENT en mode Classic
      if (!isRapidMode && newWinCount % 3 === 0 && opponentSpecialCharges < 3) {
        setOpponentSpecialCharges(prev => Math.min(prev + 1, 3));
      }
    }

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
    }, 800); // Réduit de 1500ms à 800ms pour plus de fluidité
  };

  const handleWar = () => {
    setRoundResult('WAR');
    setMessageKey('battle');
    setPhase(GamePhase.BATTLE);
    // setShowSwordClash(true);
    triggerShake();
    Vibration.vibrate([0, 100, 50, 100]); // Pattern vibration

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

  const handleSurrender = () => {
    setShowSurrenderDialog(false);
    // Ne pas enregistrer les stats en mode Rapid (pas de points ELO)
    if (opponent && !isRapidMode) {
      recordGame('LOSS', opponent.name, opponent.countryCode || 'FR');
    }
    setPhase(GamePhase.GAME_OVER);
    // Force player to have 0 cards to show defeat
    setPlayer(prev => (prev ? { ...prev, deck: [] } : null));
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

  const handleBackPress = () => {
    if (showRankedWarning) {
      setShowSurrenderDialog(true);
      return;
    }
    onNavigate(Screen.HOME);
  };

  if (!player || !opponent) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const isGameOver = phase === GamePhase.GAME_OVER;
  const showRankedWarning = isRankedMode && !isGameOver;
  const showRapidTimer = isRapidMode && !isGameOver;

  if (isGameOver) {
    const didWin = player.deck.length > opponent.deck.length;
    const activityRate = totalRoundsPlayedRef.current > 0 
      ? Math.round((playerActiveRoundsRef.current / totalRoundsPlayedRef.current) * 100) 
      : 0;
    
    return (
      <View style={styles.gameOverContainer}>
        <Text style={styles.gameOverEmoji}>{didWin ? '🏆' : '💀'}</Text>
        <Text style={styles.gameOverTitle}>{didWin ? t.victory : t.defeat}</Text>
        <Text style={styles.gameOverSubtitle}>
          {isRapidMode 
            ? (didWin ? t.rapid_win : (defeatReason === 'inactivity' ? t.rapid_inactivity : t.rapid_loss))
            : (didWin ? t.won_all : t.lost_all)
          }
        </Text>
        <View style={styles.gameOverCard}>
          {!isRapidMode && (
            <View style={styles.gameOverRow}>
              <Text style={styles.gameOverLabel}>Points ELO</Text>
              <Text style={[styles.gameOverValue, { color: didWin ? '#22C55E' : '#F87171' }]}>
                {didWin ? '+52' : '-26'}
              </Text>
            </View>
          )}
          {isRapidMode && (
            <>
              <View style={styles.gameOverRow}>
                <Text style={styles.gameOverLabel}>Mode</Text>
                <Text style={[styles.gameOverValue, { color: '#F97316' }]}>
                  {t.rapid_mode_label}
                </Text>
              </View>
              {defeatReason === 'inactivity' && !didWin && (
                <View style={styles.gameOverRow}>
                  <Text style={styles.gameOverLabel}>Taux d'activité</Text>
                  <Text style={[styles.gameOverValue, { color: activityRate < 50 ? '#EF4444' : '#F97316' }]}>
                    {activityRate}%
                  </Text>
                </View>
              )}
            </>
          )}
          <View style={styles.gameOverRow}>
            <Text style={styles.gameOverLabel}>Adversaire</Text>
            <Text style={styles.gameOverValue}>
              {opponent.name} {getFlagEmoji(opponent.countryCode || '') ?? '🏳️'}
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
      <SwordClash visible={showSwordClash} onDone={() => setShowSwordClash(false)} />

      <View
        style={[
          styles.headerArea,
          { paddingTop: insets.top + 16, paddingHorizontal: 16 },
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.backWrapper}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.return_menu}
              onPress={handleBackPress}
            >
              <Text style={styles.backText}>{'←'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.statusText, getStatusColor()]} numberOfLines={1}>
            {t[messageKey]}
          </Text>
          <View style={styles.topAction}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Abandonner"
              onPress={() => setShowSurrenderDialog(true)}
              style={styles.surrenderButton}
            >
              <Text style={styles.surrenderIcon}>🏳️</Text>
            </TouchableOpacity>
          </View>
        </View>
        {showRapidTimer && (
          <View style={styles.timerBadge}>
            <Text style={styles.timerLabel}>{t.rapid_timer_label}</Text>
            <Text style={styles.timerValue}>{formatSeconds(rapidTimeLeft)}</Text>
          </View>
        )}
      </View>

      <Animated.View
        style={[
          styles.field,
          shakeStyle,
          { paddingBottom: Math.max(100, insets.bottom + 80) },
        ]}
      >
        {/* Zone adversaire */}
        <View style={styles.opponentSection}>
          <View style={styles.opponentHeader}>
            <Text style={styles.opponentLabel}>
              {t.opponent} {getFlagEmoji(opponent.countryCode || '') ?? '🏳️'}
            </Text>
            {opponentUsingSpecial && (
              <View style={styles.opponentActiveChargeBadge}>
                <Text style={styles.opponentActiveChargeText}>⚡ UTILISÉE</Text>
              </View>
            )}
          </View>
          <HealthBar current={opponent.deck.length} max={52} color="#EF4444" />
          <AnimatedCardWrapper isVisible={true}>
            <Card
              key={opponent.currentCard?.id || 'opponent-empty'}
              card={opponent.currentCard}
              isFaceUp={
                phase === GamePhase.REVEALING ||
                phase === GamePhase.RESOLVING ||
                phase === GamePhase.BATTLE
              }
              isLosing={roundResult === 'WIN'}
              isWinning={roundResult === 'LOSS'}
            />
          </AnimatedCardWrapper>
        </View>

        {/* Pot */}
        <View style={styles.potSection}>
          {pot.length > 0 && (
            <Text style={styles.potText}>
              {t.pot}: {pot.length}
            </Text>
          )}
        </View>

        {/* Zone joueur */}
        <View style={styles.playerSection}>
          {/* Contrôles en haut pour éviter le déplacement */}
          <View style={styles.controls}>
            {hasPeeked && !player.isLocked ? (
              <Button fullWidth onPress={handlePlayerLock}>
                <View style={styles.fightButtonContent}>
                  <Text style={styles.fightText}>{t.fight}</Text>
                  {isRapidMode && (
                    <Text style={[
                      styles.fightTimerText,
                      roundTimeLeft <= 3 && styles.fightTimerUrgent
                    ]}>
                      ⏱️ {roundTimeLeft}s
                    </Text>
                  )}
                </View>
              </Button>
            ) : hasPeeked && player.isLocked ? (
              <Text style={styles.waitingText}>{t.waiting}</Text>
            ) : (
              <Text style={styles.tapCardHint}>
                {roundCountRef.current <= 2 ? t.look_card : t.your_turn}
              </Text>
            )}
          </View>

          {/* Carte + Toggles côte à côte */}
          <View style={styles.cardWithToggles}>
            {/* Toggle Bouclier (gauche) - TOUJOURS VISIBLE */}
            <TouchableOpacity
              style={[
                styles.sideToggle,
                playerUsingSpecial === 'defense' && styles.sideToggleActive
              ]}
              onPress={handleUseDefense}
              activeOpacity={0.7}
              disabled={playerSpecialCharges === 0 || !hasPeeked || player?.isLocked}
            >
              <ShieldIcon 
                size={48} 
                color="#3B82F6" 
                active={playerUsingSpecial === 'defense'}
              />
            </TouchableOpacity>

            {/* Carte au centre */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t.look_card}
              onPress={handlePlayerPeek}
              activeOpacity={0.7}
            >
              <AnimatedCardWrapper 
                isVisible={true} 
                pulse={!hasPeeked && phase === GamePhase.WAITING}
              >
                <Card
                  key={player.currentCard?.id || 'player-empty'}
                  card={player.currentCard}
                  isFaceUp={hasPeeked || phase !== GamePhase.WAITING}
                  isWinning={roundResult === 'WIN'}
                  isLosing={roundResult === 'LOSS'}
                />
              </AnimatedCardWrapper>
            </TouchableOpacity>

            {/* Toggle Épée (droite) - TOUJOURS VISIBLE */}
            <TouchableOpacity
              style={[
                styles.sideToggle,
                playerUsingSpecial === 'attack' && styles.sideToggleActive
              ]}
              onPress={handleUseAttack}
              activeOpacity={0.7}
              disabled={playerSpecialCharges === 0 || !hasPeeked || player?.isLocked}
            >
              <SwordIcon 
                size={48} 
                color="#F97316" 
                active={playerUsingSpecial === 'attack'}
              />
            </TouchableOpacity>
          </View>

          {/* Indicateur de charges (compact) */}
          {playerSpecialCharges > 0 && (
            <View style={styles.chargesIndicator}>
              {[...Array(3)].map((_, i) => (
                <Text key={i} style={styles.chargeIconSmall}>
                  {i < playerSpecialCharges ? '⚡' : '○'}
                </Text>
              ))}
              {opponentSpecialCharges > 0 && (
                <Text style={styles.opponentChargesSmall}>
                  {' '}| Adv: {opponentSpecialCharges}⚡
                </Text>
              )}
            </View>
          )}
          
          <HealthBar current={player.deck.length} max={52} color="#22C55E" />
          <Text style={styles.playerLabel}>{t.me}</Text>
        </View>
      </Animated.View>

      {/* Surrender Confirmation Modal */}
      {showSurrenderDialog && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Abandonner la partie ?</Text>
            <Text style={styles.modalText}>
              Vous perdrez automatiquement et votre ELO sera réduit.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowSurrenderDialog(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSurrender}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonConfirmText]}>
                  Abandonner
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  headerArea: {
    paddingBottom: 12,
  },
  field: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-evenly',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backWrapper: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  backText: {
    color: '#E5E7EB',
    fontSize: 28,
    fontWeight: '300',
  },
  statusText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
    marginHorizontal: 60,
  },
  topAction: {
    position: 'absolute',
    right: 0,
    zIndex: 1,
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
    marginBottom: 4, // Minimal
  },
  opponentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  opponentActiveChargeBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  opponentActiveChargeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  opponentAvatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  opponentLabelCompact: {
    color: theme.textMuted,
    fontSize: 12,
    flex: 1,
  },
  opponentAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  opponentLabel: {
    color: theme.textMuted,
    fontSize: 12,
    marginBottom: 2, // Minimal
  },
  timerBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 8,
    marginBottom: 16,
  },
  timerLabel: {
    color: theme.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timerValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  potSection: {
    alignItems: 'center',
    minHeight: 24, // Augmenté pour visibilité
    marginVertical: 8, // Plus d'espace
  },
  potText: {
    color: theme.battle,
    fontWeight: '900',
    fontSize: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.battle,
  },
  playerSection: {
    alignItems: 'center',
  },
  tapCardHint: {
    color: theme.primary,
    fontSize: 14, // Réduit de 16 à 14
    fontWeight: '700',
    marginBottom: 0, // Supprimé (déjà dans controls)
    textAlign: 'center',
  },
  playerLabel: {
    color: theme.primary,
    marginTop: 4,
  },
  controls: {
    marginBottom: 8, // Réduit de 12 à 8
    width: '100%',
    paddingHorizontal: 20,
    minHeight: 50, // Réduit de 60 à 50
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    color: theme.textMuted,
    textAlign: 'center',
  },
  fightButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fightText: {
    color: '#000000',
    fontWeight: '700',
  },
  fightTimerText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '900',
  },
  fightTimerUrgent: {
    color: '#EF4444',
  },
  waitingText: {
    color: theme.textMuted,
    textAlign: 'center',
  },
  cardWithToggles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  sideToggle: {
    width: 60,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sideToggleActive: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  chargesIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chargeIconSmall: {
    fontSize: 16,
    marginHorizontal: 2,
  },
  opponentChargesSmall: {
    fontSize: 11,
    color: '#9CA3AF',
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
  surrenderButton: {
    padding: 8,
  },
  surrenderIcon: {
    fontSize: 20,
  },
  specialBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    zIndex: 10,
  },
  attackBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  defenseBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  specialBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowRadius: 2,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    color: theme.primary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    color: '#E5E7EB',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#374151',
  },
  modalButtonConfirm: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
  },
});
