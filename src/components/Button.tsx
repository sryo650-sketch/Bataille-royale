import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, StyleProp, AccessibilityRole } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type SizeTextKey = `${Size}Text`;
type VariantTextKey = `${Variant}Text`;

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  fullWidth?: boolean;
  size?: Size;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
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
  accessibilityRole,
  accessibilityLabel,
}) => {
  return (
    <Pressable
      style={[
        styles.base,
        styles[size],
        styles[variant],
        fullWidth ? styles.fullWidth : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      <Text
        style={[
          styles.text,
          styles[`${size}Text` as SizeTextKey],
          styles[`${variant}Text` as VariantTextKey],
          textStyle,
        ]}
      >
        {children}
      </Text>
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
