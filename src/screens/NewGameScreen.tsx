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
  const [prevCards, setPrevCards] = useState<{ 
    myCard?: string; 
    oppCard?: string; 
    mySpecial?: 'attack' | 'defense' | null;
    oppSpecial?: 'attack' | 'defense' | null;
  }>({});
  const [showKraken, setShowKraken] = useState(false); // Overlay visuel Kraken
  const prevRound = React.useRef(gameState?.roundCount ?? 0);
  const lockingRef = React.useRef(false); // Protection double-clic
  
  // Flip Manuel
  const [myCardRevealed, setMyCardRevealed] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleFlip = () => {
    // Bloquer le flip si : en train de flipper, déjà locked, ou en phase de résolution
    if (isFlipping || currentPlayer?.isLocked || showResult || usePrevCards) return;
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
      
      // FIX CLIPPING : Synchroniser le retournement et le changement de données
      // au même moment (T+1.5s) pour éviter le clipping visuel
      const timeouts: NodeJS.Timeout[] = [];
      
      timeouts.push(setTimeout(() => {
        setShowResult(false);
        setUsePrevCards(false); // Changement simultané des données
        prevRound.current = gameState.roundCount;
      }, 1500));

      return () => {
        timeouts.forEach(clearTimeout);
      };
    } else {
      // Tant qu'on ne change pas de round, on tient à jour les "prevCards" 
      // pour qu'elles soient prêtes au moment de la transition.
      // On ne met PAS à jour si une transition est en cours (usePrevCards === true).
      if (!usePrevCards) {
        setPrevCards({
          myCard: currentPlayer?.deck?.[0],
          oppCard: opponent?.deck?.[0],
          mySpecial: currentPlayer?.usingSpecial,
          oppSpecial: opponent?.usingSpecial
        });
      }
    }
  }, [gameState?.roundCount, currentPlayer?.deck, opponent?.deck, usePrevCards]);

  // 🐙 Détection de l'événement Kraken
  useEffect(() => {
    if (gameState?.krakenEvent && (gameState.krakenEvent.p1Card || gameState.krakenEvent.p2Card)) {
      // Afficher l'overlay Kraken
      setShowKraken(true);
      
      // Masquer après 3 secondes
      setTimeout(() => {
        setShowKraken(false);
      }, 3000);
    }
  }, [gameState?.krakenEvent]);

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
    if (!gameId || actionLoading || lockingRef.current) return;
    
    lockingRef.current = true;
    try {
      setError(null);
      
      // Si une attaque spéciale est sélectionnée, l'envoyer au serveur
      if (localUsingSpecial) {
        await useSpecial(gameId, localUsingSpecial);
      }
      
      await lockCard(gameId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      lockingRef.current = false;
    }
  }, [gameId, actionLoading, lockCard, useSpecial, setError, localUsingSpecial]);

  const handleToggleSpecial = useCallback((type: 'attack' | 'defense') => {
    // Ne pas permettre de changer après avoir lock
    if (currentPlayer?.isLocked) return;
    
    // Bloquer si pas de charges ET pas de Momentum
    if ((currentPlayer?.specialCharges ?? 0) <= 0 && !currentPlayer?.hasMomentum) {
      Alert.alert("Pas de charges", "Vous n'avez plus de charges spéciales !");
      return;
    }
    
    // Toggle : si déjà sélectionné, désélectionner. Sinon, sélectionner
    if (localUsingSpecial === type) {
      setLocalUsingSpecial(null);
    } else {
      setLocalUsingSpecial(type);
    }
  }, [currentPlayer?.isLocked, currentPlayer?.specialCharges, currentPlayer?.hasMomentum, localUsingSpecial]);

  const handleSurrender = useCallback(async () => {
    if (!gameId || actionLoading || lockingRef.current) return;
    
    lockingRef.current = true;

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
    
    // Valeurs de base
    let myValue = displayedMyCard.rank;
    let oppValue = displayedOppCard.rank;
    
    // Appliquer les bonus (ATTACK_BONUS = 10, DEFENSE_BONUS = 10)
    // Utiliser les bonus stockés si on affiche les anciennes cartes
    const mySpecial = usePrevCards ? prevCards.mySpecial : currentPlayer?.usingSpecial;
    const oppSpecial = usePrevCards ? prevCards.oppSpecial : opponent?.usingSpecial;
    
    if (mySpecial === 'attack') myValue += 10;
    else if (mySpecial === 'defense') myValue += 10;
    
    if (oppSpecial === 'attack') oppValue += 10;
    else if (oppSpecial === 'defense') oppValue += 10;
    
    if (myValue > oppValue) return 'win';
    if (myValue < oppValue) return 'lose';
    return 'draw';
  }, [showResult, displayedMyCard, displayedOppCard, usePrevCards, prevCards, currentPlayer?.usingSpecial, opponent?.usingSpecial]);

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

      {/* 🐙 Overlay Kraken Attack */}
      {showKraken && gameState?.krakenEvent && (
        <ReanimatedAnimated.View 
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(300)}
          style={styles.krakenOverlay}
        >
          <Text style={styles.krakenEmoji}>🐙</Text>
          <Text style={styles.krakenTitle}>KRAKEN ATTACK</Text>
          <Text style={styles.krakenSubtitle}>Le Kraken dévore les cartes faibles !</Text>
          <View style={styles.krakenCards}>
            {(() => {
              const myCard = isPlayer1 ? gameState.krakenEvent.p1Card : gameState.krakenEvent.p2Card;
              const oppCard = isPlayer1 ? gameState.krakenEvent.p2Card : gameState.krakenEvent.p1Card;
              const myCardData = myCard ? getCardById(myCard) : null;
              const oppCardData = oppCard ? getCardById(oppCard) : null;
              
              const formatCard = (card: typeof myCardData) => {
                if (!card) return 'Aucune';
                const suitEmoji: Record<string, string> = { H: '♥️', D: '♦️', C: '♣️', S: '♠️' };
                const emoji = suitEmoji[card.suit as any] || '';
                const rankName = ['', '', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R', 'As'][card.rank] || '';
                return `${rankName} ${emoji}`;
              };
              
              return (
                <>
                  <Text style={styles.krakenCardText}>
                    Vous : <Text style={styles.krakenCardValue}>{formatCard(myCardData)}</Text>
                  </Text>
                  <Text style={styles.krakenCardText}>
                    {opponent?.name || 'Adversaire'} : <Text style={styles.krakenCardValue}>{formatCard(oppCardData)}</Text>
                  </Text>
                </>
              );
            })()}
          </View>
        </ReanimatedAnimated.View>
      )}

      {/* Badge Momentum Adversaire */}
      {opponent?.hasMomentum && !opponent?.isLocked && (
        <ReanimatedAnimated.View 
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.momentumBadgeOpponent}
        >
          <Text style={styles.momentumTextOpponent}>🔥 MOMENTUM</Text>
          <Text style={styles.momentumSubtextOpponent}>Bonus Actif</Text>
        </ReanimatedAnimated.View>
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
            <Text style={{fontSize: 16, marginLeft: 6}}>
              {opponent?.countryCode 
                ? String.fromCodePoint(...[...opponent.countryCode.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
                : '🌍'
              }
            </Text>
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
            hasMomentum={opponent?.hasMomentum}
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
        {roundResult === 'draw' && gameState?.pot && gameState.pot.length > 0 && (
          <View style={styles.potDisplay}>
            <Text style={styles.potText}>Pot : {gameState.pot.length} cartes</Text>
          </View>
        )}
      </View>

      {/* Badge Momentum */}
      {currentPlayer?.hasMomentum && !currentPlayer?.isLocked && (
        <ReanimatedAnimated.View 
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.momentumBadge}
        >
          <Text style={styles.momentumText}>🔥 MOMENTUM</Text>
          <Text style={styles.momentumSubtext}>Bonus GRATUIT</Text>
        </ReanimatedAnimated.View>
      )}

      {/* ZONE JOUEUR (Bas) */}
      <View style={styles.playerZone}>
        
        {/* Contrôles */}
        <View style={styles.controls}>
          {showResult || usePrevCards ? (
            <ReanimatedAnimated.Text 
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.waitingText}
            >
              RÉSOLUTION...
            </ReanimatedAnimated.Text>
          ) : currentPlayer?.isLocked || actionLoading ? (
            <ReanimatedAnimated.Text 
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.waitingText}
            >
              EN ATTENTE...
            </ReanimatedAnimated.Text>
          ) : isMyFaceUp ? (
            <ReanimatedAnimated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <TouchableOpacity
                style={[styles.combatButton, actionLoading && styles.disabledButton]}
                onPress={handleLockCard}
                disabled={actionLoading}
                activeOpacity={actionLoading ? 1 : 0.7}
              >
                <Text style={styles.combatButtonText}>COMBATTRE</Text>
                {turnTimeLeft !== null && (
                  <Text style={styles.combatTimer}>{turnTimeLeft}s</Text>
                )}
              </TouchableOpacity>
            </ReanimatedAnimated.View>
          ) : (
            <ReanimatedAnimated.Text 
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.hintText}
            >
              DÉVOILEZ VOS ARMES
            </ReanimatedAnimated.Text>
          )}
        </View>

        {/* Carte + Toggles (Main alignée) */}
        <View style={styles.cardWithToggles}>
          {/* Toggle Bouclier */}
          <TouchableOpacity
            style={[styles.sideToggle, selectedSpecial === 'defense' && styles.sideToggleActive]}
            onPress={() => handleToggleSpecial('defense')}
            activeOpacity={0.7}
            disabled={!isMyFaceUp || currentPlayer?.isLocked || currentPlayer?.hasCooldown || ((currentPlayer?.specialCharges ?? 0) <= 0 && !currentPlayer?.hasMomentum)}
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
            disabled={!isMyFaceUp || currentPlayer?.isLocked || currentPlayer?.hasCooldown || ((currentPlayer?.specialCharges ?? 0) <= 0 && !currentPlayer?.hasMomentum)}
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
              hasMomentum={currentPlayer?.hasMomentum}
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
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  potText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  momentumBadge: {
    position: 'absolute',
    bottom: 380,
    right: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    zIndex: 50,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  momentumText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  momentumSubtext: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#93C5FD',
    marginTop: 1,
  },
  momentumBadgeOpponent: {
    position: 'absolute',
    top: 360,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    zIndex: 50,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  momentumTextOpponent: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  momentumSubtextOpponent: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FCA5A5',
    marginTop: 1,
  },
  roundResultText: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 95 : 75,
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
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
  // 🐙 Styles Kraken Overlay
  krakenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 78, 59, 0.92)', // Vert sombre océanique
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  krakenEmoji: {
    fontSize: 80,
    marginBottom: 15,
    textShadowColor: '#10B981',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  krakenTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#10B981', // Vert émeraude
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: '#10B981',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
    marginBottom: 8,
  },
  krakenSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D1FAE5', // Vert clair
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 25,
  },
  krakenCards: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  krakenCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1FAE5',
    textAlign: 'center',
  },
  krakenCardValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
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
