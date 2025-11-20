import React, { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface AnimatedCardWrapperProps {
  children: ReactNode;
  trigger: unknown;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

export const AnimatedCardWrapper: React.FC<AnimatedCardWrapperProps> = ({
  children,
  trigger,
  style,
  duration = 320,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withTiming(180, { duration });
  }, [duration, rotation, trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotation.value}deg` },
      { scale: rotation.value < 90 ? 0.96 : 1 },
    ],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};
