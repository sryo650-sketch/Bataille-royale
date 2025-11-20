import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type SwordClashProps = {
  visible: boolean;
  onDone?: () => void;
};

export const SwordClash: React.FC<SwordClashProps> = ({ visible, onDone }) => {
  const leftSword = useSharedValue(-80);
  const rightSword = useSharedValue(80);
  const flash = useSharedValue(0);

  const reset = () => {
    leftSword.value = -80;
    rightSword.value = 80;
    flash.value = 0;
  };

  const play = () => {
    leftSword.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.exp) });
    rightSword.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.exp) });
    flash.value = withTiming(1, { duration: 0 }, () => {
      flash.value = withTiming(0, { duration: 150 }, (finished) => {
        if (finished && onDone) {
          runOnJS(onDone)();
        }
      });
    });
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
    transform: [{ translateX: leftSword.value }, { rotate: '-25deg' }],
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightSword.value }, { rotate: '25deg' }],
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
      <View style={styles.swords}>
        <Animated.View style={[styles.sword, styles.left, leftStyle]}>
          <SwordSvg />
        </Animated.View>
        <Animated.View style={[styles.sword, styles.right, rightStyle]}>
          <SwordSvg />
        </Animated.View>
      </View>
    </View>
  );
};

const SwordSvg = () => (
  <Svg width="60" height="60" viewBox="0 0 60 60">
    <Path d="M30 5 L30 40" stroke="#E6C15A" strokeWidth={4} strokeLinecap="round" />
    <Path d="M25 40 L35 40" stroke="#E6C15A" strokeWidth={5} strokeLinecap="round" />
    <Path d="M30 45 L30 55" stroke="#E6C15A" strokeWidth={4} strokeLinecap="round" />
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  swords: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sword: {
    position: 'absolute',
  },
  left: {
    left: 0,
  },
  right: {
    right: 0,
  },
});
