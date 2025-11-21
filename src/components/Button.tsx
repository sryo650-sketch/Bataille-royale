import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  PressableStateCallbackType,
  ActivityIndicator,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

// Configuration
const BUTTON_CONFIG = {
  primary: { bg: '#D4AF37', text: '#000000' },
  secondary: { bg: '#1F2933', text: '#FFFFFF' },
  outline: { bg: 'transparent', text: '#D4AF37', border: '#D4AF37' },
  ghost: { bg: 'transparent', text: '#9CA3AF' },
} as const;

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: Variant;
  fullWidth?: boolean;
  size?: Size;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
  loading?: boolean;
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
  accessibilityLabel,
  testID,
  loading = false,
}) => {
  // Logique de style conteneur
  const containerStyles = useMemo(() => {
    const base: StyleProp<ViewStyle>[] = [styles.base, styles[size], styles[variant]];
    if (fullWidth) base.push(styles.fullWidth);
    if (disabled) base.push(styles.disabled);
    if (style) base.push(style);
    return base;
  }, [size, variant, fullWidth, disabled, style]);

  // Logique de style texte (Correction du typage dynamique)
  const labelStyles = useMemo(() => {
    // On mappe explicitement pour éviter l'erreur TS "Index signature..."
    const variantTextMap: Record<Variant, TextStyle> = {
      primary: styles.primaryText,
      secondary: styles.secondaryText,
      outline: styles.outlineText,
      ghost: styles.ghostText,
    };
    
    const sizeTextMap: Record<Size, TextStyle> = {
      sm: styles.smText,
      md: styles.mdText,
      lg: styles.lgText,
    };

    return [styles.text, sizeTextMap[size], variantTextMap[variant], textStyle];
  }, [size, variant, textStyle]);

  // Couleur du loader adaptée au texte
  const loaderColor = variant === 'primary' ? '#000' : BUTTON_CONFIG[variant].text;

  return (
    <Pressable
      style={({ pressed }: PressableStateCallbackType) => [
        containerStyles,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      onPress={disabled || loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <Text style={labelStyles} numberOfLines={1}>
          {children}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  
  // --- SIZES ---
  sm: { paddingHorizontal: 16, paddingVertical: 6, minHeight: 36 },
  md: { paddingHorizontal: 24, paddingVertical: 10, minHeight: 48 },
  lg: { paddingHorizontal: 32, paddingVertical: 14, minHeight: 56 },

  smText: { fontSize: 14 },
  mdText: { fontSize: 16 },
  lgText: { fontSize: 18 },

  // --- VARIANTS (Containers) ---
  primary: { backgroundColor: BUTTON_CONFIG.primary.bg },
  secondary: { backgroundColor: BUTTON_CONFIG.secondary.bg },
  outline: { 
    backgroundColor: BUTTON_CONFIG.outline.bg, 
    borderColor: BUTTON_CONFIG.outline.border 
  },
  ghost: { backgroundColor: BUTTON_CONFIG.ghost.bg },

  // --- VARIANTS (Text) ---
  primaryText: { color: BUTTON_CONFIG.primary.text },
  secondaryText: { color: BUTTON_CONFIG.secondary.text },
  outlineText: { color: BUTTON_CONFIG.outline.text },
  ghostText: { color: BUTTON_CONFIG.ghost.text },
});
