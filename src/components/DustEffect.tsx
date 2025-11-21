import React, { useMemo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';

interface DustParticleProps {
  angle: number;
  distance: number;
  delay: number;
  color: string;
}

const DustParticle: React.FC<DustParticleProps> = React.memo(({
  angle,
  distance,
  delay,
  color,
}) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    // Calcul trigonométrique
    const rad = (angle * Math.PI) / 180;
    const toX = Math.cos(rad) * distance;
    const toY = Math.sin(rad) * distance;

    // Configuration de l'animation
    // Easing.out(Easing.quad) est plus performant que cubic et suffit pour de la poussière
    const moveConfig = { duration: 600, easing: Easing.out(Easing.quad) };

    // 1. Opacité : Apparition flash puis disparition lente
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 50 }), // Flash rapide
      withTiming(0, { duration: 550 }) // Fade out
    ));

    // 2. Mouvement : Explosion vers l'extérieur
    translateX.value = withDelay(delay, withTiming(toX, moveConfig));
    translateY.value = withDelay(delay, withTiming(toY, moveConfig));

    // 3. Échelle : Grossit légèrement en partant
    scale.value = withDelay(delay, withTiming(1.2, { duration: 600 }));

    // Cleanup propre au démontage
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
    };
  }, [angle, distance, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
});

DustParticle.displayName = 'DustParticle';

interface DustEffectProps {
  isVisible: boolean;
  color?: string;
  delay?: number;
  particleCount?: number;
}

export const DustEffect: React.FC<DustEffectProps> = React.memo(({
  isVisible,
  color = 'rgba(255, 215, 0, 0.6)', // Or légèrement transparent par défaut
  delay = 0,
  particleCount = 12, // Un peu plus dense par défaut
}) => {
  // Si invisible, on ne rend rien du tout (Performance)
  if (!isVisible) return null;

  return (
    <View
      style={styles.container}
      pointerEvents="none" // Important : le clic traverse l'effet
    >
      {/* On génère les particules à la volée. 
         Comme le composant est re-monté quand isVisible passe à true,
         Math.random() sera ré-exécuté, créant une explosion unique à chaque fois.
      */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <DustParticle
          key={i} // L'index suffit ici car la liste est statique durant la vie du composant
          angle={i * (360 / particleCount) + (Math.random() * 40 - 20)} // Variation angulaire
          distance={40 + Math.random() * 40} // Variation distance plus marquée
          delay={delay}
          color={color}
        />
      ))}
    </View>
  );
});

DustEffect.displayName = 'DustEffect';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    // Centrage parfait sans dimension physique qui bloquerait les clics
    width: 0,
    height: 0,
    zIndex: 10, // S'assure que la poussière est au-dessus de la carte
    overflow: 'visible', // Laisse les particules sortir du point zéro
  },
  particle: {
    position: 'absolute',
    width: 6, // Un peu plus fin
    height: 6,
    borderRadius: 3,
    // Pas d'ombre (Shadow) pour garantir 60fps même sur vieux Android
  },
});
