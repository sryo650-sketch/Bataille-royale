import React, { useEffect, useMemo } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { DustEffect } from './DustEffect';

interface AnimatedCardWrapperProps {
  children: React.ReactNode;
  index?: number;
  isVisible?: boolean;
  style?: StyleProp<ViewStyle>;
  pulse?: boolean;
}

export const AnimatedCardWrapper: React.FC<AnimatedCardWrapperProps> = ({
  children,
  index = 0,
  isVisible = true,
  style,
  pulse = false,
}) => {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  // Délai uniquement pour l'entrée en cascade
  const entryDelay = useMemo(() => index * 100, [index]);

  // 1. Gestion ENTRÉE / SORTIE (Visibilité uniquement)
  useEffect(() => {
    if (isVisible) {
      // Entrée
      translateY.value = withDelay(
        entryDelay,
        withSpring(0, { damping: 15, stiffness: 150 })
      );
      opacity.value = withDelay(
        entryDelay,
        withTiming(1, { duration: 300 })
      );
    } else {
      // Sortie
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      
      translateY.value = withTiming(50, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, entryDelay]);

  // 2. Gestion du PULSE et de l'ÉCHELLE (Séparé pour éviter le reset)
  useEffect(() => {
    cancelAnimation(scale);

    if (!isVisible) {
      scale.value = withTiming(0.8, { duration: 200 });
      return;
    }

    if (pulse) {
      // Mode Pulse : On démarre la boucle
      scale.value = withDelay(
        // Petit délai seulement si on vient d'apparaître, sinon immédiat
        opacity.value < 1 ? entryDelay : 0,
        withRepeat(
          withSequence(
            withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // Infini
          true // Reverse (plus fluide pour la respiration)
        )
      );
    } else {
      // Mode Normal : On revient à 1 (ou on fait le pop d'entrée)
      scale.value = withDelay(
        opacity.value < 1 ? entryDelay : 0,
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  }, [pulse, isVisible, entryDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      {children}
      {/* Le delay permet à la poussière d'arriver juste quand la carte touche le "sol" */}
      <DustEffect isVisible={isVisible} delay={entryDelay + 200} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
