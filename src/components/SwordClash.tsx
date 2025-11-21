import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

type SwordClashProps = {
  visible: boolean;
  onDone?: () => void;
};

const PARTICLE_COUNT = 12;
const { width } = Dimensions.get('window');

export const SwordClash: React.FC<SwordClashProps> = ({ visible, onDone }) => {
  const leftSword = useSharedValue(-100);
  const rightSword = useSharedValue(100);
  const flash = useSharedValue(0);
  const scale = useSharedValue(1);
  const particles = Array.from({ length: PARTICLE_COUNT }).map(() => ({
    x: useSharedValue(0),
    y: useSharedValue(0),
    opacity: useSharedValue(0),
  }));

  // Create animated styles for particles OUTSIDE of render
  const particleStyles = particles.map((p) =>
    useAnimatedStyle(() => ({
      transform: [{ translateX: p.x.value }, { translateY: p.y.value }],
      opacity: p.opacity.value,
    }))
  );

  const reset = () => {
    leftSword.value = -100;
    rightSword.value = 100;
    flash.value = 0;
    scale.value = 1;
    particles.forEach((p) => {
      p.x.value = 0;
      p.y.value = 0;
      p.opacity.value = 0;
    });
  };

  const play = () => {
    // Swords clash
    leftSword.value = withSequence(
      withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }),
      withTiming(-20, { duration: 100 })
    );
    rightSword.value = withSequence(
      withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }),
      withTiming(20, { duration: 100 })
    );

    // Impact scale
    scale.value = withSequence(
      withDelay(200, withSpring(1.5, { damping: 10 })),
      withTiming(1, { duration: 300 })
    );

    // Flash
    flash.value = withDelay(
      220,
      withSequence(
        withTiming(0.8, { duration: 50 }),
        withTiming(0, { duration: 300 })
      )
    );

    // Particles
    particles.forEach((p, i) => {
      const angle = (i * 360) / PARTICLE_COUNT;
      const rad = (angle * Math.PI) / 180;
      const distance = Math.random() * 80 + 40;

      p.opacity.value = withDelay(220, withTiming(1, { duration: 0 }));
      p.x.value = withDelay(
        220,
        withTiming(Math.cos(rad) * distance, { duration: 400, easing: Easing.out(Easing.quad) })
      );
      p.y.value = withDelay(
        220,
        withTiming(Math.sin(rad) * distance, { duration: 400, easing: Easing.out(Easing.quad) })
      );
      p.opacity.value = withDelay(
        220,
        withSequence(withTiming(1, { duration: 50 }), withTiming(0, { duration: 350 }))
      );
    });

    // Cleanup
    setTimeout(() => {
      if (onDone) {
        onDone();
      }
    }, 1500);
  };

  useEffect(() => {
    if (visible) {
      play();
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const leftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: leftSword.value },
      { rotate: '-25deg' },
      { scale: scale.value },
    ],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rightSword.value },
      { rotate: '25deg' },
      { scale: scale.value },
    ],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.flash, flashStyle]} />
      <View style={styles.center}>
        {particles.map((p, i) => (
          <Animated.View key={i} style={[styles.particle, particleStyles[i]]}>
            <View style={styles.particleDot} />
          </Animated.View>
        ))}
        <View style={styles.swords}>
          <Animated.View style={[styles.sword, styles.left, leftStyle]}>
            <SwordSvg />
          </Animated.View>
          <Animated.View style={[styles.sword, styles.right, rightStyle]}>
            <SwordSvg flip />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const SwordSvg = ({ flip = false }: { flip?: boolean }) => (
  <Svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: [{ scaleX: flip ? -1 : 1 }] }}>
    {/* Blade */}
    <Path
      d="M28 10 L32 10 L35 70 L25 70 Z"
      fill="#C0C0C0"
      stroke="#8B8B8B"
      strokeWidth={1.5}
    />
    {/* Blade shine */}
    <Path d="M29 12 L29 68" stroke="#E8E8E8" strokeWidth={1} opacity={0.6} />

    {/* Guard */}
    <Path
      d="M15 70 L45 70 L45 76 L15 76 Z"
      fill="#D4AF37"
      stroke="#B8860B"
      strokeWidth={1.5}
    />

    {/* Handle */}
    <Path
      d="M27 76 L27 88"
      stroke="#78350F"
      strokeWidth={6}
      strokeLinecap="round"
    />

    {/* Pommel */}
    <Circle cx="27" cy="91" r="4" fill="#D4AF37" stroke="#B8860B" strokeWidth={1.5} />
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F97316', // Orange flash for battle
  },
  swords: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sword: {
    position: 'absolute',
  },
  left: {
    // Adjust positioning based on new SVG size
    marginLeft: -40,
  },
  right: {
    marginLeft: 40,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE047', // Yellow sparks
    shadowColor: '#F97316',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  }
});
