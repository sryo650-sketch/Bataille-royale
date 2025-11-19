import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  fullWidth?: boolean;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  fullWidth = false,
  size = 'md',
  disabled = false,
  style,
  textStyle,
}) => {
  const containerStyles: ViewStyle[] = [
    styles.base,
    styles[size],
    styles[variant],
  ];

  if (fullWidth) {
    containerStyles.push(styles.fullWidth);
  }
  if (disabled) {
    containerStyles.push(styles.disabled);
  }
  if (style) {
    containerStyles.push(style);
  }

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${size}Text` as const] as TextStyle,
    styles[`${variant}Text` as const] as TextStyle,
  ];

  if (textStyle) {
    textStyles.push(textStyle);
  }

  return (
    <Pressable
      style={containerStyles}
      onPress={disabled ? undefined : onPress}
    >
      <Text style={textStyles}>{children}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '700',
  },
  sm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  md: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  primary: {
    backgroundColor: '#D4AF37',
  },
  primaryText: {
    color: '#000000',
  },
  secondary: {
    backgroundColor: '#1F2933',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  outlineText: {
    color: '#D4AF37',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: '#9CA3AF',
  },
});
