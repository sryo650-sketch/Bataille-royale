import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SpecialChargesProps {
  charges: number;
  streak: number;
  onUseAttack?: () => void;
  onUseDefense?: () => void;
  disabled?: boolean;
  opponentCharges?: number; // Afficher les charges adverses
}

export const SpecialCharges: React.FC<SpecialChargesProps> = ({
  charges,
  streak,
  onUseAttack,
  onUseDefense,
  disabled = false,
  opponentCharges,
}) => {
  const [mode, setMode] = useState<'attack' | 'defense'>('attack');
  const nextChargeProgress = (streak % 3) / 3; // Changé de 10 à 3

  // Ne rien afficher si pas de charges du tout (mode classique au début)
  // MODIFICATION : On veut toujours voir les slots vides !
  // if (charges === 0 && (opponentCharges === undefined || opponentCharges === 0)) {
  //   return null;
  // }

  return (
    <View style={styles.container}>
      {/* Affichage des charges */}
      <View style={styles.chargesRow}>
        {[...Array(3)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.charge,
              i < charges && styles.chargeActive,
            ]}
          >
            {i < charges && <Text style={styles.chargeIcon}>⚡</Text>}
          </View>
        ))}
      </View>

      {/* Barre de progression vers la prochaine charge */}
      {charges < 3 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${nextChargeProgress * 100}%` }]} />
          <Text style={styles.progressText}>{streak % 3}/3</Text>
        </View>
      )}

      {/* Affichage des charges adverses (si fournies) */}
      {opponentCharges !== undefined && opponentCharges > 0 && (
        <View style={styles.opponentChargesRow}>
          <Text style={styles.opponentLabel}>Adversaire:</Text>
          {[...Array(opponentCharges)].map((_, i) => (
            <Text key={i} style={styles.opponentCharge}>⚡</Text>
          ))}
        </View>
      )}

      {/* Toggle Attack/Defense + Bouton d'utilisation - SUPPRIMÉ (Géré par NewGameScreen) */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4, // Réduit de 8 à 4
  },
  chargesRow: {
    flexDirection: 'row',
    gap: 4, // Réduit de 6 à 4
    marginBottom: 4, // Réduit de 6 à 4
  },
  charge: {
    width: 24, // Réduit de 28 à 24
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
    backgroundColor: 'rgba(55, 65, 81, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargeActive: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  chargeIcon: {
    fontSize: 14, // Réduit de 16 à 14
  },
  progressContainer: {
    width: 90,
    height: 4,
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 4, // Réduit de 8 à 4
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FBBF24',
  },
  progressText: {
    position: 'absolute',
    top: -16,
    right: 0,
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  opponentChargesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4, // Réduit de 6 à 4
  },
  opponentLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginRight: 4,
  },
  opponentCharge: {
    fontSize: 12,
    opacity: 0.6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleButton: {
    width: 32, // Réduit de 36 à 32
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#374151',
    backgroundColor: 'rgba(55, 65, 81, 0.2)',
  },
  toggleActive: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleText: {
    fontSize: 14, // Réduit de 16 à 14
  },
  useButton: {
    paddingHorizontal: 12, // Réduit de 16 à 12
    paddingVertical: 6, // Réduit de 8 à 6
    borderRadius: 16,
    borderWidth: 2,
  },
  attackButton: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  defenseButton: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  useButtonText: {
    fontSize: 10, // Réduit de 11 à 10
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
