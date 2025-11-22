import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useGameActions, useGameRealtime, useInactivityTimer } from '../hooks';
import { useRapidTimer } from '../hooks/useRapidTimer';
import { useThemeColor } from '../contexts/ThemeContext';
import { NewGameScreen } from './NewGameScreen';
import { Screen } from '../types';

/**
 * Écran de test pour valider l'architecture backend
 * À utiliser avant de migrer le GameScreen complet
 */
export const TestBackendScreen: React.FC = () => {
  const colors = useThemeColor();
  const { createGame, lockCard, useSpecial, surrender, loading, error } = useGameActions();
  
  const [gameId, setGameId] = useState<string | null>(null);
  const [showGame, setShowGame] = useState(false);
  const { gameState, loading: gameLoading } = useGameRealtime(gameId);
  const rapidTimeLeft = useRapidTimer(gameState);
  
  const [logs, setLogs] = useState<string[]>([]);

  // Auto-lock après 10 secondes d'inactivité
  const handleAutoLock = useCallback(async () => {
    if (!gameId) return;
    addLog('⏱️ Auto-lock (timeout 10s)');
    try {
      await lockCard(gameId);
    } catch (err) {
      addLog('❌ Erreur auto-lock: ' + (err as Error).message);
    }
  }, [gameId]);

  // Défaite après 6 auto-locks
  const handleDefeat = useCallback(async () => {
    if (!gameId) return;
    addLog('❌ 6 auto-locks d\'affilée → DÉFAITE');
    try {
      await surrender(gameId);
    } catch (err) {
      addLog('❌ Erreur surrender: ' + (err as Error).message);
    }
  }, [gameId]);

  useInactivityTimer(gameState, true, handleAutoLock, handleDefeat);

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Test 1: Créer une partie
  const handleCreateGame = async (mode: 'classic' | 'rapid') => {
    try {
      addLog(`🎮 Création partie ${mode}...`);
      const startTime = Date.now();
      const newGameId = await createGame({ mode });
      const duration = Date.now() - startTime;
      setGameId(newGameId);
      setShowGame(true);
      addLog(`✅ Partie créée (${duration}ms)`);
    } catch (err: any) {
      addLog(`❌ Erreur: ${err.message}`);
    }
  };

  const handleNavigate = () => {
    setShowGame(false);
    setGameId(null);
  };

  // Si une partie est active, afficher NewGameScreen
  if (showGame && gameId) {
    return <NewGameScreen gameId={gameId} onNavigate={handleNavigate} />;
  }

  // Test 2: Verrouiller la carte
  const handleLockCard = async () => {
    if (!gameId) {
      addLog('❌ Aucune partie active');
      return;
    }
    
    try {
      addLog('🔒 Verrouillage carte...');
      const startTime = Date.now();
      await lockCard(gameId);
      const duration = Date.now() - startTime;
      addLog(`✅ Carte verrouillée (${duration}ms)`);
    } catch (err: any) {
      addLog(`❌ Erreur: ${err.message}`);
    }
  };

  // Test 3: Utiliser une charge
  const handleUseSpecial = async (type: 'attack' | 'defense') => {
    if (!gameId) {
      addLog('❌ Aucune partie active');
      return;
    }
    
    try {
      addLog(`⚔️ Utilisation ${type}...`);
      const startTime = Date.now();
      await useSpecial(gameId, type);
      const duration = Date.now() - startTime;
      addLog(`✅ ${type} activée (${duration}ms)`);
    } catch (err: any) {
      addLog(`❌ Erreur: ${err.message}`);
    }
  };

  // Test 4: Abandonner
  const handleSurrender = async () => {
    try {
      addLog('🏳️ Abandon...');
      
      // Feedback optimiste : afficher immédiatement
      const startTime = Date.now();
      
      await surrender(gameId!);
      
      const duration = Date.now() - startTime;
      addLog(`✅ Partie abandonnée (${duration}ms)`);
      setGameId(null);
    } catch (err) {
      addLog('❌ Erreur: ' + (err as Error).message);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🧪 Test Backend</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Validation Architecture Server-Authoritative
        </Text>
      </View>

      {/* Section: État de la Partie */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 État de la Partie</Text>
        
        {gameLoading && <ActivityIndicator size="small" color={colors.primary} />}
        
        {!gameId && (
          <Text style={[styles.info, { color: colors.textSecondary }]}>
            Aucune partie active
          </Text>
        )}
        
        {gameState && (
          <View style={styles.gameInfo}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              🆔 ID: {gameId?.slice(0, 8)}...
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              🎮 Mode: {gameState.mode}
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              📍 Phase: {gameState.phase}
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              🔄 Round: {gameState.roundCount}
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              👤 P1 Cartes: {gameState.player1.deck.length}
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              🤖 P2 Cartes: {gameState.player2.deck.length}
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              ⚡ P1 Charges: {gameState.player1.specialCharges}
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              🔒 P1 Locked: {gameState.player1.isLocked ? 'Oui' : 'Non'}
            </Text>
            <Text style={[styles.infoText, { color: colors.text }]}>
              🔒 P2 Locked: {gameState.player2.isLocked ? 'Oui' : 'Non'}
            </Text>
            {gameState.mode === 'rapid' && rapidTimeLeft !== null && (
              <Text style={[styles.infoText, { color: colors.text }]}>
                ⏱️ Timer: {rapidTimeLeft}s
              </Text>
            )}
            {gameState.winner && (
              <Text style={[styles.infoText, { color: '#22C55E' }]}>
                🏆 Gagnant: {gameState.winner === gameState.player1.uid ? 'Player 1' : 'Player 2'}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Section: Actions */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>🎮 Actions</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => handleCreateGame('classic')}
            disabled={loading || !!gameId}
          >
            <Text style={styles.buttonText}>Créer Classic</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#F97316' }]}
            onPress={() => handleCreateGame('rapid')}
            disabled={loading || !!gameId}
          >
            <Text style={styles.buttonText}>Créer Rapid</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#3B82F6' }]}
            onPress={handleLockCard}
            disabled={loading || !gameId || gameState?.phase !== 'WAITING'}
          >
            <Text style={styles.buttonText}>🔒 Lock Card</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#EF4444' }]}
            onPress={() => handleUseSpecial('attack')}
            disabled={loading || !gameId || gameState?.player1.specialCharges === 0}
          >
            <Text style={styles.buttonText}>⚔️ Attack</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#10B981' }]}
            onPress={() => handleUseSpecial('defense')}
            disabled={loading || !gameId || gameState?.player1.specialCharges === 0}
          >
            <Text style={styles.buttonText}>🛡️ Defense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#6B7280' }]}
            onPress={handleSurrender}
            disabled={loading || !gameId || gameState?.phase === 'GAME_OVER'}
          >
            <Text style={styles.buttonText}>🏳️ Surrender</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.resetButton, { backgroundColor: colors.border }]}
          onPress={() => {
            setGameId(null);
            addLog('🔄 Reset');
          }}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>🔄 Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Section: Logs */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 Logs</Text>
        
        {error && (
          <Text style={[styles.errorText, { color: '#EF4444' }]}>
            ❌ {error}
          </Text>
        )}
        
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Chargement...
            </Text>
          </View>
        )}
        
        <View style={styles.logsContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={[styles.logText, { color: colors.textSecondary }]}>
              {log}
            </Text>
          ))}
        </View>
      </View>

      {/* Section: Instructions */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📖 Instructions</Text>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          1. Créer une partie (Classic ou Rapid)
        </Text>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          2. Utiliser une charge (Attack/Defense) - optionnel
        </Text>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          3. Verrouiller la carte (Lock Card)
        </Text>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          4. Le serveur résout automatiquement le round
        </Text>
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          5. Répéter jusqu'à la fin de partie
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  gameInfo: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  logsContainer: {
    gap: 4,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  instruction: {
    fontSize: 14,
    marginBottom: 4,
  },
});
