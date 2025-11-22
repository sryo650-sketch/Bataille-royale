import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  useSharedValue,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface HealthBarProps {
  current: number;
  max: number;
  color?: string;
  label?: string;
  showPercentage?: boolean;
  krakensCount?: number; // Nombre de cartes retirées par le Kraken
  testID?: string;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  current,
  max,
  color,
  label = 'PV',
  showPercentage = false,
  krakensCount = 0,
  testID = 'health-bar',
}) => {
  // Calcul du pourcentage
  const percent = useMemo(() => {
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100, (current / max) * 100));
  }, [current, max]);

  const isCritical = percent <= 25;

  // Couleur dynamique
  const finalColor = useMemo(() => {
    if (color) return color;
    if (isCritical) return '#EF4444';
    if (percent <= 50) return '#F59E0B';
    return '#22C55E';
  }, [percent, color, isCritical]);

  // --- ANIMATIONS ---

  // 1. Remplissage de la barre (Largeur)
  const widthStyle = useAnimatedStyle(() => ({
    width: withTiming(`${percent}%`, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    }),
  }));

  // 2. Pulse "Critique" (Échelle)
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (isCritical) {
      // Battement de cœur si critique
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 200 }),
          withTiming(1, { duration: 200 })
        ),
        -1, // Infini
        true // Reverse
      );
    } else {
      // Retour au calme
      cancelAnimation(pulseAnim);
      pulseAnim.value = withTiming(1);
    }
  }, [isCritical]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // Accessibilité
  const accessibilityLabel = useMemo(
    () => `${label}: ${current} sur ${max}, État ${isCritical ? 'Critique' : 'Normal'}`,
    [current, max, label, isCritical]
  );

  return (
    // WRAPPER PRINCIPAL (Pas d'overflow hidden ici pour laisser le badge dépasser)
    <Animated.View
      style={[styles.wrapper, containerAnimatedStyle]}
      testID={testID}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max, now: current }}
    >
      {/* BADGE CRITIQUE (Positionné en dehors de la barre) */}
      {isCritical && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>!</Text>
        </View>
      )}

      {/* CONTENEUR BARRE (C'est lui qui a overflow hidden) */}
      <View style={[styles.barContainer, { borderColor: isCritical ? '#EF4444' : '#374151' }]}>
        {/* Fond (Track) */}
        <View style={styles.track} />

        {/* Remplissage (Fill) */}
        <Animated.View style={[styles.fill, widthStyle, { backgroundColor: finalColor }]} />

        {/* Texte */}
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            {showPercentage 
              ? `${Math.round(percent)}%` 
              : `${current} / ${max} ${label}${krakensCount > 0 ? `  (-${krakensCount})` : ''}`
            }
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Nouveau wrapper pour gérer l'espace du badge
  wrapper: {
    width: '100%',
    maxWidth: 220,
    alignSelf: 'center',
    marginVertical: 10, // Un peu plus de marge pour le badge
    position: 'relative',
  },
  barContainer: {
    height: 24, // Un peu plus fin pour l'élégance
    borderRadius: 12,
    overflow: 'hidden', // C'est ICI qu'on coupe ce qui dépasse (la barre verte)
    backgroundColor: '#1F2937',
    borderWidth: 1,
    // borderColor est géré dynamiquement
    position: 'relative',
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // Plus subtil
  },
  fill: {
    height: '100%',
    borderRadius: 12, // Doit matcher le container
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Badge "pop-up"
  badge: {
    position: 'absolute',
    top: -8,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#1F2937', // Contour couleur de fond pour effet "cut"
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
