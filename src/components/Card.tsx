import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Image,
  Animated,
  StyleProp,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import { CardData, Suit, Rank } from '../types';
import { SUIT_COLORS, RANK_LABELS } from '../constants';

// Typage explicite de l'asset pour éviter les erreurs TS
const cardBack: ImageSourcePropType = require('../../assets/back_002.png');

type CardSize = 'sm' | 'md' | 'lg';

interface CardProps {
  card?: CardData;
  isFaceUp: boolean;
  isWinning?: boolean;
  isLosing?: boolean;
  size?: CardSize;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = React.memo(({
  card,
  isFaceUp,
  isWinning,
  isLosing,
  size = 'lg',
  style,
  accessibilityLabel,
}) => {
  // 1. MÉMOÏSATION metrics
  const { width, height, fontSizes } = useMemo(() => getCardMetrics(size), [size]);
  
  const borderColor = useMemo(() => {
    if (isWinning) return '#10B981'; // Emerald-500
    if (isLosing) return '#EF4444'; // Red-500
    return '#D4AF37'; // Gold
  }, [isWinning, isLosing]);

  const suitColor = useMemo(() => getSuitColor(card?.suit, card?.rank), [card?.suit, card?.rank]);

  // 2. ANIMATION
  // Initialisation directe à la bonne valeur. Pas besoin de useEffect de reset.
  const rotation = useRef(new Animated.Value(isFaceUp ? 0 : 180)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: isFaceUp ? 0 : 180,
      duration: 400, // Un poil plus lent pour apprécier le 3D
      useNativeDriver: true, // Indispensable pour 60fps
    }).start();
  }, [isFaceUp]);

  // 3. INTERPOLATIONS (La clé du flip 3D)
  const frontAnimatedStyle = useMemo(() => ({
    zIndex: isFaceUp ? 1 : 0, // Aide pour le clic sur iOS parfois
    opacity: rotation.interpolate({
      inputRange: [0, 89, 90],
      outputRange: [1, 1, 0], // Disparaît pile à 90°
    }),
    transform: [
      { perspective: 1000 }, // Perspective plus profonde pour plus de réalisme
      {
        rotateY: rotation.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  }), [isFaceUp]); // Ajout isFaceUp en dépendance pour le zIndex

  const backAnimatedStyle = useMemo(() => ({
    zIndex: isFaceUp ? 0 : 1,
    opacity: rotation.interpolate({
      inputRange: [90, 91, 180],
      outputRange: [0, 1, 1], // Apparaît pile après 90°
    }),
    transform: [
      { perspective: 1000 },
      {
        rotateY: rotation.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  }), [isFaceUp]);

  // 4. RENDU (Optimisation structurelle)
  const containerStyle = useMemo(() => [
    styles.card, 
    { 
      width, 
      height, 
      borderColor,
      borderWidth: (isWinning || isLosing) ? 4 : 2,
      shadowColor: borderColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: (isWinning || isLosing) ? 1 : 0,
      shadowRadius: (isWinning || isLosing) ? 25 : 0,
      elevation: (isWinning || isLosing) ? 12 : 0,
    }, 
    style
  ], [width, height, borderColor, style, isWinning, isLosing]);

  // Gestion état vide
  if (!card) {
    return (
      <View
        style={[styles.placeholder, { width, height }, style]}
        accessible={true}
        accessibilityLabel="Emplacement vide"
      />
    );
  }

  return (
    <Animated.View
      style={containerStyle}
      accessible={true}
      accessibilityLabel={accessibilityLabel || `Carte ${getRankLabel(card.rank)} de ${card.suit}`}
    >
      {/* --- RECTO --- */}
      <Animated.View style={[styles.face, styles.faceFront, frontAnimatedStyle]} pointerEvents="none">
        <View style={styles.frontSurface}>
          <View style={styles.content}>
            {/* Coin Haut Gauche */}
            <View style={[styles.corner, styles.cornerTop]}>
              <Text style={[styles.rank, { color: suitColor, fontSize: fontSizes.rank }]}>
                {getRankLabel(card.rank)}
              </Text>
              <Text style={[styles.suitSmall, { color: suitColor, fontSize: fontSizes.suitSmall }]}>
                {card.suit}
              </Text>
            </View>
            
            {/* Centre */}
            <View style={styles.center}>
              <Text style={[styles.suitBig, { color: suitColor, fontSize: fontSizes.suitBig }]}>
                {card.suit}
              </Text>
            </View>
            
            {/* Coin Bas Droit */}
            <View style={[styles.corner, styles.cornerBottom]}>
              <Text style={[styles.rank, { color: suitColor, fontSize: fontSizes.rank }]}>
                {getRankLabel(card.rank)}
              </Text>
              <Text style={[styles.suitSmall, { color: suitColor, fontSize: fontSizes.suitSmall }]}>
                {card.suit}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* --- VERSO --- */}
      <Animated.View style={[styles.face, styles.faceBack, backAnimatedStyle]} pointerEvents="none">
        <View style={styles.backFrame}>
          <Image source={cardBack} style={styles.backImage} resizeMode="cover" />
        </View>
      </Animated.View>
    </Animated.View>
  );
});

// --- UTILITAIRES ---
const getCardMetrics = (size: CardSize) => {
  // Ajustement des ratios pour être plus proche d'une vraie carte de poker (2.5 x 3.5 pouces)
  // Ratio standard ~1.4
  const metrics = {
    sm: { width: 60, height: 84, fontSizes: { rank: 12, suitSmall: 10, suitBig: 20 } },
    md: { width: 90, height: 126, fontSizes: { rank: 16, suitSmall: 12, suitBig: 30 } },
    lg: { width: 120, height: 168, fontSizes: { rank: 20, suitSmall: 14, suitBig: 40 } },
  };
  return metrics[size];
};

const getRankLabel = (rank: Rank): string => RANK_LABELS[rank] || '?';

const getSuitColor = (suit?: Suit, rank?: Rank) => {
  // Cartes fortes (V, D, R, As) en OR
  if (rank && [Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE].includes(rank)) {
    return '#D4AF37'; // Or
  }
  
  if (!suit) return '#111827';
  // Utilisation de constantes globales ou fallback
  return SUIT_COLORS[suit] || '#111827';
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 2, // Attention: borderWidth compte dans la taille sur RN. 
    borderRadius: 12,
    backgroundColor: 'transparent', // Important pour que l'animation 3D soit propre
    // Pas d'overflow hidden ici si on veut des effets d'ombre externes, 
    // mais pour une carte simple c'est ok.
  },
  placeholder: {
    borderWidth: 2,
    borderColor: '#374151', // Gris foncé
    borderRadius: 12,
    borderStyle: 'dashed', // Joli effet pour un emplacement vide
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  face: {
    ...StyleSheet.absoluteFillObject, // Remplace top/left/right/bottom: 0
    borderRadius: 10, // Un peu moins que le parent pour le border
    overflow: 'hidden',
    // backfaceVisibility supprimé pour compatibilité Android avec l'opacité
  },
  faceFront: {
    backgroundColor: '#FFFFFF',
  },
  faceBack: {
    backgroundColor: '#0C1120',
  },
  frontSurface: {
    flex: 1,
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  backFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', // Fond de sécurité si l'image charge pas
  },
  backImage: {
    width: '100%',
    height: '100%',
  },
  corner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30, // Fixe une largeur pour éviter le décalage
  },
  cornerTop: {
    top: 4,
    left: 4,
  },
  cornerBottom: {
    bottom: 4,
    right: 4,
    transform: [{ rotate: '180deg' }],
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontWeight: '800', // Plus gras pour lisibilité
    textAlign: 'center',
    includeFontPadding: false, // Fix alignement vertical Android
  },
  suitSmall: {
    marginTop: -2, // Resserre un peu rank/suit
  },
  suitBig: {
    includeFontPadding: false,
  },
});