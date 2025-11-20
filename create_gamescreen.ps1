$content = @'
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

type MessageKey = 'tap_start' | 'tap_card' | 'ready_fight' | 'duel_imminent' | 'round_won' | 'round_lost' | 'battle';

const { width } = Dimensions.get('window');

const Slash = ({ delay, angle, direction = 1 }: { delay: number; angle: string; direction?: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', width: width * 1.5, height: 5, backgroundColor: '#FFFFFF', shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 12, top: '50%', left: -width * 0.25, transform: [{ rotate: angle }, { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-100 * direction, 100 * direction] }) }, { scaleX: anim.interpolate({ inputRange: [0, 0.1, 0.5, 1], outputRange: [0, 1, 1, 0] }) }], opacity: anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }) }} />
  );
};

const BattleEffect = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={{ flex: 1, backgroundColor: 'rgba(249,115,22,0.15)', borderWidth: 4, borderColor: '#FFD700' }} />
    <Slash delay={0} angle="45deg" direction={1} />
    <Slash delay={250} angle="-45deg" direction={-1} />
  </View>
);

export const GameScreen: React.FC<GameScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { recordGame } = useUserStats();
  const ctaScale = useRef(new Animated.Value(1)).current;
  const opponentPulse = useRef(new Animated.Value(1)).current;
  const titleShake = useRef(new Animated.Value(0)).current;
  const playerPulse = useRef(new Animated.Value(1)).current;
  const roundCountRef = useRef(0);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.WAITING);
  const [player, setPlayer] = useState<Player | null>(null);
  const [opponent, setOpponent] = useState<Player | null>(null);
  const [pot, setPot] = useState<CardData[]>([]);
  const [messageKey, setMessageKey] = useState<MessageKey>('tap_start');
  const [roundResult, setRoundResult] = useState<'WIN' | 'LOSS' | 'WAR' | null>(null);
  const [hasPeeked, setHasPeeked] = useState(false);
  const vibrate = (duration = 20) => Vibration.vibrate(Platform.OS === 'ios' ? Math.min(duration, 15) : duration);
'@

$content | Out-File -FilePath "src\screens\GameScreen.tsx" -Encoding utf8 -NoNewline
