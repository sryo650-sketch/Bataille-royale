import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Configuration centrale
const TIERS_CONFIG = {
  IRON:     { color: '#9CA3AF', bgOpacity: 0.05, glow: false, label: 'FER' },
  BRONZE:   { color: '#D97706', bgOpacity: 0.10, glow: false, label: 'BRONZE' },
  SILVER:   { color: '#E5E7EB', bgOpacity: 0.10, glow: false, label: 'ARGENT' },
  GOLD:     { color: '#FBBF24', bgOpacity: 0.15, glow: false, label: 'OR' },
  PLATINUM: { color: '#22D3EE', bgOpacity: 0.20, glow: true,  label: 'PLATINE' },
  DIAMOND:  { color: '#C084FC', bgOpacity: 0.25, glow: true,  label: 'DIAMANT' },
  MASTER:   { color: '#EF4444', bgOpacity: 0.30, glow: true,  label: 'MAÎTRE' },
  LEGEND:   { color: '#FFFFFF', bgOpacity: 0.40, glow: true,  label: 'LÉGENDE' },
} as const;

type TierKey = keyof typeof TIERS_CONFIG;

interface TierBadgeProps {
  rank: number;
  showRankNumber?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ rank, showRankNumber = true }) => {

  // 1. Déterminer le Tier
  const tierKey = useMemo((): TierKey => {
    if (rank === 1) return 'LEGEND';
    if (rank <= 100) return 'MASTER';
    if (rank <= 1000) return 'DIAMOND';
    if (rank <= 10000) return 'PLATINUM';
    if (rank <= 50000) return 'GOLD';
    if (rank <= 100000) return 'SILVER';
    if (rank <= 500000) return 'BRONZE';
    return 'IRON';
  }, [rank]);

  const config = TIERS_CONFIG[tierKey];

  // 2. Styles Dynamiques (C'est là que la magie opère)
  const containerStyle: ViewStyle = useMemo(() => ({
    borderColor: config.color,
    backgroundColor: hexToRgba(config.color, config.bgOpacity),
    // Les hauts rangs ont une bordure plus épaisse
    borderWidth: tierKey === 'LEGEND' || tierKey === 'MASTER' ? 2 : 1,
    // Ajout d'ombre (Glow) uniquement pour les hauts rangs
    ...(config.glow ? {
      shadowColor: config.color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: tierKey === 'LEGEND' ? 1 : 0.6,
      shadowRadius: tierKey === 'LEGEND' ? 15 : 8,
      elevation: tierKey === 'LEGEND' ? 10 : 5, // Pour Android
    } : {})
  }), [tierKey, config]);

  const textStyle: TextStyle = useMemo(() => ({
    color: config.color,
    // Texte plus gras et plus grand pour les hauts rangs
    fontWeight: config.glow ? '900' : '600',
    textShadowColor: config.glow ? config.color : undefined,
    textShadowRadius: config.glow ? 5 : 0,
  }), [config]);

  return (
    <View style={[styles.badge, containerStyle]}>
      {/* Petite icône ou symbole pour différencier sans couleur */}
      {tierKey === 'LEGEND' && <Text style={styles.icon}>👑</Text>}
      {tierKey === 'MASTER' && <Text style={styles.icon}>⚔️</Text>}
      {tierKey === 'DIAMOND' && <Text style={styles.icon}>💎</Text>}

      <Text style={[styles.text, textStyle]}>
        {config.label}
        {showRankNumber && rank > 1 && <Text style={styles.rankNumber}> #{formatRank(rank)}</Text>}
      </Text>
    </View>
  );
};

// Petit helper pour convertir Hex en RGBA
const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const formatRank = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start', // Le badge ne prend que la place nécessaire
    marginVertical: 4,
  },
  text: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  rankNumber: {
    opacity: 0.8,
    fontSize: 11,
  },
  icon: {
    fontSize: 10,
    marginRight: 4,
  }
});
