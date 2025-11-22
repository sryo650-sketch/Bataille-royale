import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme, useThemeColor } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { UserStatsProvider } from './src/contexts/UserStatsContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { NavigationHandler, Screen, GameConfig } from './src/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { TestFirebaseScreen } from './src/screens/TestFirebaseScreen';
import { TestBackendScreen } from './src/screens/TestBackendScreen';
import { checkOnboardingStatus } from './src/utils/onboardingUtils';

const AppNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [currentGameConfig, setCurrentGameConfig] = useState<GameConfig | undefined>(undefined);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const colors = useThemeColor();
  const { effective } = useTheme();
  const { currentUser } = useAuth(); // ✅ Accès à l'état d'authentification

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await checkOnboardingStatus();
      setHasCompletedOnboarding(completed);
    };
    checkOnboarding();
  }, []);

  const handleNavigate: NavigationHandler = (screen, options) => {
    if (screen === Screen.GAME) {
      setCurrentGameConfig(options?.gameConfig ?? { mode: 'classic' });
    } else {
      setCurrentGameConfig(undefined);
    }
    setCurrentScreen(screen);
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  // 🧪 DÉVELOPPEMENT : Bypass onboarding pour accès direct au TestBackendScreen
  // ATTENTION : L'onboarding demande pseudo/email/photo mais PAS de mot de passe !
  // Pour te connecter à Firebase, utilise le bouton Logout dans TestBackendScreen
  
  // Show loading while checking onboarding status
  // if (hasCompletedOnboarding === null) {
  //   return (
  //     <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
  //       <StatusBar style={effective === 'light' ? 'dark' : 'light'} />
  //       <View style={styles.container} />
  //     </SafeAreaView>
  //   );
  // }

  // Show onboarding if not completed
  // if (!hasCompletedOnboarding) {
  //   return (
  //     <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
  //       <StatusBar style={effective === 'light' ? 'dark' : 'light'} />
  //       <OnboardingScreen onComplete={handleOnboardingComplete} />
  //     </SafeAreaView>
  //   );
  // }

  const renderScreen = () => {
    // 🧪 TEST FIREBASE - Écran de login Firebase (email + password)
    // Affiche TestFirebaseScreen si non connecté, sinon TestBackendScreen
    if (!currentUser) {
      return <TestFirebaseScreen />;
    }
    
    // 🧪 TEST BACKEND - Écran de test après connexion
    return <TestBackendScreen />;
    
    if (currentScreen === Screen.HOME) {
      return <HomeScreen onNavigate={handleNavigate} />;
    }
    if (currentScreen === Screen.GAME) {
      return <GameScreen onNavigate={handleNavigate} gameConfig={currentGameConfig} />;
    }
    if (currentScreen === Screen.STATS) {
      return <StatsScreen onNavigate={handleNavigate} />;
    }
    if (currentScreen === Screen.PROFILE) {
      return <ProfileScreen onNavigate={handleNavigate} />;
    }
    return <HomeScreen onNavigate={handleNavigate} />;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={effective === 'light' ? 'dark' : 'light'} />
      <View style={styles.container}>{renderScreen()}</View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <UserStatsProvider>
            <SafeAreaProvider>
              <AppNavigator />
            </SafeAreaProvider>
          </UserStatsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
  },
});
