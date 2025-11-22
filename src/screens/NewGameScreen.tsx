import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import ReanimatedAnimated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useGameActions, useGameRealtime } from '../hooks';
import { useRapidTimer } from '../hooks/useRapidTimer';
import { useInactivityTimer } from '../hooks/useInactivityTimer';
import { auth } from '../lib/firebase';
import { NavigationHandler, Screen } from '../types';
import { Card } from '../components/Card';
import { HealthBar } from '../components/HealthBar';
import { SpecialCharges } from '../components/SpecialCharges';
import { ShieldIcon } from '../components/ShieldIcon';
import { SwordIcon } from '../components/SwordIcon';
import { getCardById } from '../utils/cardUtils';

interface NewGameScreenProps {
  onNavigate: NavigationHandler;
  gameId: string;
}

/**
 * NewGameScreen - Version Layout Corrigé
 * Logique originale préservée à 100%
 */
export const NewGameScreen: React.FC<NewGameScreenProps> = ({ onNavigate, gameId }) => {
  const currentUserId = auth.currentUser?.uid;
  
  const { gameState, loading, error: gameError } = useGameRealtime(gameId);
  const { lockCard, useSpecial, surrender, loading: actionLoading } = useGameActions();
  const rapidTimeLeft = useRapidTimer(gameState);
  
  const [error, setError] = useState<string | null>(null);

  // État local pour le toggle des attaques spéciales (avant lock)
  const [localUsingSpecial, setLocalUsingSpecial] = useState<'attack' | 'defense' | null>(null);

  // Identification STRICTE
  const isPlayer1 = gameState?.player1.uid === currentUserId;
  const isPlayer2 = gameState?.player2.uid === currentUserId;
  
  const currentPlayer = isPlayer1 ? gameState?.player1 : (isPlayer2 ? gameState?.player2 : null);
  const opponent = isPlayer1 ? gameState?.player2 : gameState?.player1;

  // Debug State
  useEffect(() => {
    if (gameState) {
      console.log(` STATE: P1=${gameState.player1.isLocked}, P2=${gameState.player2.isLocked}, Me=${currentPlayer?.isLocked}, Opp=${opponent?.isLocked}`);
    }
  }, [gameState, currentPlayer?.isLocked, opponent?.isLocked]);

  // Gestion Showdown & Transition Fluide
  const [showResult, setShowResult] = useState(false); // Contrôle la visibilité (Face Up)
  const [usePrevCards, setUsePrevCards] = useState(false); // Contrôle les données (Old vs New)
  const [prevCards, setPrevCards] = useState<{ myCard?: string, oppCard?: string }>({});
  const prevRound = React.useRef(gameState?.roundCount ?? 0);
  
  // Flip Manuel
  const [myCardRevealed, setMyCardRevealed] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleFlip = () => {
    if (isFlipping || currentPlayer?.isLocked) return;
    setIsFlipping(true);
    setMyCardRevealed(!myCardRevealed);
    setTimeout(() => setIsFlipping(false), 600); // Un peu plus que l'animation (400ms)
  };

  // Réinitialiser le toggle local quand on change de round
  useEffect(() => {
    if (gameState?.roundCount) {
      setLocalUsingSpecial(null);
    }
  }, [gameState?.roundCount]);

  // Effet de transition Round N -> N+1
  useEffect(() => {
    if (!gameState) return;

    if (gameState.roundCount > prevRound.current) {
      // 1. DÉBUT TRANSITION (T+0)
      // On fige les anciennes cartes et on les montre
      setUsePrevCards(true);
      setShowResult(true);
      setMyCardRevealed(false); // On laisse showResult gérer la visibilité
      
      // 2. RETOURNEMENT (T+2s)
      // On retourne les cartes (dos visible) -> Animation de flip commence
      const t1 = setTimeout(() => {
        setShowResult(false);
      }, 2000);

      // 3. ÉCHANGE DE DONNÉES (T+2.6s)
      // Une fois retournées (600ms plus tard), on met les nouvelles cartes
      // et on reset l'état local
      const t2 = setTimeout(() => {
        setUsePrevCards(false);
        prevRound.current = gameState.roundCount;
      }, 2600);

      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      // Tant qu'on ne change pas de round, on tient à jour les "prevCards" 
      // pour qu'elles soient prêtes au moment de la transition.
      // On ne met PAS à jour si une transition est en cours (usePrevCards === true).
      if (!usePrevCards) {
        setPrevCards({
          myCard: currentPlayer?.deck?.[0],
          oppCard: opponent?.deck?.[0]
        });
      }
    }
  }, [gameState?.roundCount, currentPlayer?.deck, opponent?.deck, usePrevCards]);

  // Animation "Pulse" (Joueur seulement)
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!currentPlayer?.isLocked && !myCardRevealed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [currentPlayer?.isLocked, myCardRevealed]);

  // Utiliser le state serveur après lock, ou le state local avant lock
  const selectedSpecial = currentPlayer?.isLocked ? currentPlayer?.usingSpecial : localUsingSpecial;

  // Validation d'appartenance
  useEffect(() => {
    if (gameState && !loading && !currentPlayer) {
      setError("Accès refusé : Vous ne faites pas partie de cette partie.");
    }
  }, [gameState, loading, currentPlayer]);

  // CRITIQUE #4: Game Over
  useEffect(() => {
    if (gameState?.phase === 'GAME_OVER') {
      console.log(' Partie terminée', {
        winner: gameState.winner,
        reason: gameState.defeatReason,
      });
    }
  }, [gameState?.phase, gameState?.winner, gameState?.defeatReason]);

  // Handlers
  const handleLockCard = useCallback(async () => {
    if (!gameId || actionLoading) return;
    try {
      setError(null);
      
      // Si une attaque spéciale est sélectionnée, l'envoyer au serveur
      if (localUsingSpecial) {
        await useSpecial(gameId, localUsingSpecial);
      }
      
      await lockCard(gameId);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [gameId, actionLoading, lockCard, useSpecial, setError, localUsingSpecial]);

  const handleToggleSpecial = useCallback((type: 'attack' | 'defense') => {
    // Ne pas permettre de changer après avoir lock
    if (currentPlayer?.isLocked) return;
    
    if ((currentPlayer?.specialCharges ?? 0) <= 0) {
      Alert.alert("Pas de charges", "Vous n'avez plus de charges spéciales !");
      return;
    }
    
    // Toggle : si déjà sélectionné, désélectionner. Sinon, sélectionner
    if (localUsingSpecial === type) {
      setLocalUsingSpecial(null);
    } else {
      setLocalUsingSpecial(type);
    }
  }, [currentPlayer?.isLocked, currentPlayer?.specialCharges, localUsingSpecial]);

  const handleSurrender = useCallback(async () => {
    if (!gameId || actionLoading) return;

    Alert.alert(
      "Abandonner",
      "Êtes-vous sûr de vouloir abandonner la partie ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Abandonner", 
          style: "destructive", 
          onPress: async () => {
            try {
              setError(null);
              await surrender(gameId);
            } catch (err) {
              setError((err as Error).message);
            }
          }
        }
      ]
    );
  }, [gameId, actionLoading, surrender, setError]);

  const handleAutoLock = useCallback(async () => {
    if (!gameId) return;
    try {
      await lockCard(gameId);
    } catch (err) {
      setError(`Auto-lock: ${(err as Error).message}`);
    }
  }, [gameId, lockCard, setError]);

  const handleDefeat = useCallback(async () => {
    if (!gameId) return;
    try {
      await surrender(gameId);
    } catch (err) {
      setError(`Défaite: ${(err as Error).message}`);
    }
  }, [gameId, surrender, setError]);

  // Hook d'inactivité
  const turnTimeLeft = useInactivityTimer(gameState, !!currentPlayer, handleAutoLock, handleDefeat);

  // Gestion expiration Timer Rapide
  useEffect(() => {
    if (rapidTimeLeft === 0 && gameState?.phase === 'WAITING' && !currentPlayer?.isLocked) {
      console.log(' Timer Rapide expiré -> Auto-lock');
      handleAutoLock();
    }
  }, [rapidTimeLeft, gameState?.phase, currentPlayer?.isLocked, handleAutoLock]);

  // PRÉPARATION DONNÉES AFFICHAGE (AVANT returns pour respecter règles hooks)
  const displayedOppCardId = usePrevCards && prevCards.oppCard 
    ? prevCards.oppCard 
    : opponent?.deck?.[0];
  
  const displayedMyCardId = usePrevCards && prevCards.myCard 
    ? prevCards.myCard 
    : currentPlayer?.deck?.[0];

  const displayedOppCard = displayedOppCardId ? getCardById(displayedOppCardId) : undefined;
  const displayedMyCard = displayedMyCardId ? getCardById(displayedMyCardId) : undefined;

  // Détermination du gagnant de la manche (uniquement pendant showResult)
  const roundResult = useMemo(() => {
    if (!showResult || !displayedMyCard || !displayedOppCard) return null;
    
    const myValue = displayedMyCard.rank;
    const oppValue = displayedOppCard.rank;
    
    if (myValue > oppValue) return 'win';
    if (myValue < oppValue) return 'lose';
    return 'draw';
  }, [showResult, displayedMyCard, displayedOppCard]);

  // État FaceUp
  const isOppFaceUp = showResult || (currentPlayer?.isLocked && (opponent?.isLocked ?? false));
  const isMyFaceUp = showResult || myCardRevealed || (currentPlayer?.isLocked && (opponent?.isLocked ?? false));

  // Cas 1: Erreur critique
  if (!currentUserId || !gameId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}> Erreur d'initialisation (Auth ou ID manquant)</Text>
        <TouchableOpacity style={styles.button} onPress={() => onNavigate(Screen.HOME)}>
          <Text style={styles.buttonText}>Retour Accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cas 2: Chargement
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.text}>Synchronisation...</Text>
      </View>
    );
  }

  // Cas 3: Erreur de jeu
  if (error || gameError || !gameState || !currentPlayer) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}> {error || gameError || "Partie inaccessible"}</Text>
        <TouchableOpacity style={styles.button} onPress={() => onNavigate(Screen.HOME)}>
          <Text style={styles.buttonText}>Quitter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // RENDER UI
  return (
    <View style={styles.container}>
      
      {/* ... */}
      {/* Info Top (Header) */}
      <View style={styles.topInfo}>
        <Text style={styles.headerText}>
          {gameState.mode === 'rapid' ? 'MODE RAPIDE' : 'MODE CLASSÉ'} • ROUND {gameState.roundCount}
        </Text>
        {rapidTimeLeft !== null && (
          <Text style={styles.globalTimer}>
             {Math.floor(rapidTimeLeft / 60)}:{ (rapidTimeLeft % 60).toString().padStart(2, '0') }
          </Text>
        )}
      </View>

      {/* Bouton Abandon */}
      <TouchableOpacity
        style={styles.surrenderButton}
        onPress={handleSurrender}
        disabled={actionLoading}
      >
        <Text style={{fontSize: 20}}>🏳️</Text>
      </TouchableOpacity>

      {/* Erreur */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}> ⚠️ {error}</Text>
        </View>
      )}

      {/* Indicateur résultat manche (positionné en absolu) */}
      {roundResult && (
        roundResult === 'draw' ? (
          <ReanimatedAnimated.View 
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.pugnaRegalisOverlay}
          >
            <Text style={styles.pugnaRegalisTitle}>⚔️ PUGNA REGALIS ⚔️</Text>
            <Text style={styles.pugnaRegalisSubtitle}>BATAILLE !</Text>
          </ReanimatedAnimated.View>
        ) : (
          <ReanimatedAnimated.Text 
            entering={FadeInDown.duration(400)}
            exiting={FadeOut.duration(200)}
            style={[
              styles.roundResultText,
              roundResult === 'win' && styles.roundResultWin,
              roundResult === 'lose' && styles.roundResultLose
            ]}
          >
            {roundResult === 'win' ? 'Manche gagnée' : 'Manche perdue'}
          </ReanimatedAnimated.Text>
        )
      )}

      {/* ZONE ADVERSAIRE (Haut) */}
      <View style={styles.opponentZone}>
        {/* Info Adversaire avec nom */}
        <View style={styles.opponentHeaderRow}>
          <View style={styles.avatarSmall}>
            <Text style={{fontSize: 20}}>🤖</Text> 
          </View>
          <View style={styles.nameFlagRow}>
            <Text style={styles.playerNameLarge}>{opponent?.name || 'Adversaire'}</Text>
            <Text style={{fontSize: 16, marginLeft: 6}}>{opponent?.countryCode ? `🏳️` : '🌍'}</Text>
          </View>
        </View>

        {/* Stats Adversaire (PV + Charges) */}
        <View style={styles.opponentStatsRow}>
          <View style={{flex: 1, marginRight: 15}}>
            <HealthBar 
              current={opponent?.deck?.length ?? 0} 
              max={52} 
              color="#EF4444" 
              label="PV"
            />
          </View>
          <SpecialCharges 
            charges={opponent?.specialCharges ?? 0} 
            streak={0} 
          />
        </View>

        {/* Carte Centrale */}
        <View style={styles.cardContainer}>
          {/* Pile dessous */}
          {(opponent?.deck?.length ?? 0) > 1 && (
            <View style={styles.deckPile} />
          )}
          <Card
            key={displayedOppCardId} 
            card={displayedOppCard}
            isFaceUp={!!isOppFaceUp}
            isWinning={roundResult === 'lose'}
            isLosing={roundResult === 'win'}
            size="md"
          />
        </View>
      </View>

      {/* ESPACE CENTRAL FLEXIBLE */}
      <View style={styles.centralZone}>
        {/* Affichage du Pot pendant les batailles */}
        {roundResult === 'draw' && (
          <ReanimatedAnimated.View 
            entering={FadeIn.duration(400)}
            style={styles.potDisplay}
          >
            <Text style={styles.potIcon}>⚔️</Text>
            <Text style={styles.potLabel}>POT DE LA BATAILLE</Text>
            <Text style={styles.potValue}>En jeu</Text>
          </ReanimatedAnimated.View>
        )}
      </View>

      {/* ZONE JOUEUR (Bas) */}
      <View style={styles.playerZone}>
        
        {/* Contrôles */}
        <View style={styles.controls}>
          {showResult || usePrevCards ? (
            <Text style={styles.waitingText}>RÉSOLUTION...</Text>
          ) : currentPlayer?.isLocked || actionLoading ? (
            <Text style={styles.waitingText}>EN ATTENTE...</Text>
          ) : isMyFaceUp ? (
            <TouchableOpacity
              style={styles.combatButton}
              onPress={handleLockCard}
              disabled={actionLoading}
            >
              <Text style={styles.combatButtonText}>COMBATTRE</Text>
              {turnTimeLeft !== null && (
                <Text style={styles.combatTimer}>{turnTimeLeft}s</Text>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={styles.hintText}>DÉVOILEZ VOS ARMES</Text>
          )}
        </View>

        {/* Carte + Toggles (Main alignée) */}
        <View style={styles.cardWithToggles}>
          {/* Toggle Bouclier */}
          <TouchableOpacity
            style={[styles.sideToggle, selectedSpecial === 'defense' && styles.sideToggleActive]}
            onPress={() => handleToggleSpecial('defense')}
            activeOpacity={0.7}
            disabled={!isMyFaceUp || currentPlayer?.isLocked || (currentPlayer?.specialCharges ?? 0) <= 0}
          >
            <ShieldIcon 
              size={36}
              color="#3B82F6" 
              active={selectedSpecial === 'defense'} 
            />
          </TouchableOpacity>

          {/* Carte Centrale */}
          <View style={styles.cardContainer}>
            {/* Pile dessous */}
            {(currentPlayer?.deck?.length ?? 0) > 1 && (
              <View style={styles.deckPile} />
            )}
            
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                onPress={handleFlip}
                activeOpacity={0.9}
                disabled={currentPlayer?.isLocked || isFlipping}
              >
                <Card
                  key={displayedMyCardId} 
                  card={displayedMyCard}
                  isFaceUp={!!isMyFaceUp}
                  isWinning={roundResult === 'win'}
                  isLosing={roundResult === 'lose'}
                  size="md"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Toggle Épée */}
          <TouchableOpacity
            style={[styles.sideToggle, selectedSpecial === 'attack' && styles.sideToggleActive]}
            onPress={() => handleToggleSpecial('attack')}
            activeOpacity={0.7}
            disabled={!isMyFaceUp || currentPlayer?.isLocked || (currentPlayer?.specialCharges ?? 0) <= 0}
          >
            <SwordIcon 
              size={36}
              color="#EF4444" 
              active={selectedSpecial === 'attack'} 
            />
          </TouchableOpacity>
        </View>

        {/* Charges & Info */}
        <View style={styles.playerInfoContainer}>
          <View style={styles.playerInfoCompact}>
            <SpecialCharges 
              charges={currentPlayer?.specialCharges ?? 0} 
              streak={0} 
            />
            <View style={{flex: 1, marginLeft: 15}}>
              <HealthBar 
                current={currentPlayer?.deck?.length ?? 0} 
                max={52} 
                color="#3B82F6" 
                label="PV"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Game Over */}
      {gameState.phase === 'GAME_OVER' && (
        <View style={styles.gameOver}>
          <Text style={styles.gameOverTitle}>
            {gameState.winner === currentUserId ? ' VICTOIRE' : ' DÉFAITE'}
          </Text>
          <Text style={styles.gameOverText}>
            Raison : {
              gameState.defeatReason === 'normal' ? 'Score final' :
              gameState.defeatReason === 'inactivity' ? 'Temps écoulé' :
              gameState.defeatReason === 'surrender' ? 'Abandon' : gameState.defeatReason
            }
          </Text>
          <TouchableOpacity
            style={styles.gameOverButton}
            onPress={() => onNavigate(Screen.HOME)}
          >
            <Text style={styles.gameOverButtonText}>Retour Menu</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  topInfo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  headerText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  globalTimer: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  surrenderButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 35,
    right: 20,
    zIndex: 50,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  errorBanner: {
    backgroundColor: '#7F1D1D',
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    marginTop: 100,
    marginBottom: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  opponentZone: {
    marginTop: 120,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centralZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  potDisplay: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  potIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  potLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 1,
    marginBottom: 4,
  },
  potValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
  },
  roundResultText: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 95 : 75,
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    zIndex: 100,
  },
  roundResultWin: {
    color: '#10B981',
  },
  roundResultLose: {
    color: '#EF4444',
  },
  pugnaRegalisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  pugnaRegalisTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#D4AF37',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: '#D4AF37',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 10,
  },
  pugnaRegalisSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 4,
    textAlign: 'center',
  },
  opponentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
    marginRight: 10,
  },
  nameFlagRow: { flexDirection: 'row', alignItems: 'center' },
  playerNameSmall: { fontSize: 14, fontWeight: 'bold', color: '#9CA3AF' },
  playerNameLarge: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  opponentStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  playerInfoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-between',
  },
  playerZone: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
  },
  cardWithToggles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 25,
  },
  sideToggle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sideToggleActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: '#D4AF37',
    transform: [{ scale: 1.1 }],
  },
  playerInfoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cardContainer: {
    width: 94,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  deckPile: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: '98%',
    height: '98%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -15,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#064E3B',
  },
  statusText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  combatButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FCD34D',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    width: '70%',
  },
  combatButtonText: { color: '#000', fontSize: 18, fontWeight: '900' },
  combatTimer: { color: '#000', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  waitingText: { color: '#6B7280', fontSize: 14, fontStyle: 'italic', letterSpacing: 1 },
  hintText: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  disabledButton: { opacity: 0.5, backgroundColor: '#4B5563', borderColor: '#374151' },
  text: { color: '#FFF' },
  button: { marginTop: 20, padding: 10, backgroundColor: '#333', borderRadius: 5 },
  buttonText: { color: '#FFF' },
  gameOver: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 20,
  },
  gameOverTitle: { fontSize: 32, fontWeight: 'bold', color: '#D4AF37', marginBottom: 10, textAlign: 'center' },
  gameOverText: { color: '#D1D5DB', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  gameOverButton: { backgroundColor: '#374151', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#4B5563' },
  gameOverButtonText: { color: '#FFF', fontWeight: 'bold' },
});