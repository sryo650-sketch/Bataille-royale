import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { UserStatsProvider } from './src/contexts/UserStatsContext';
import { GameConfig, NavigationHandler, Screen } from './src/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { StatsScreen } from './src/screens/StatsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [gameConfig, setGameConfig] = useState<GameConfig | undefined>(undefined);

  const handleNavigate: NavigationHandler = (screen, options) => {
    if (options?.gameConfig) {
      setGameConfig(options.gameConfig);
    } else if (screen !== Screen.GAME) {
      setGameConfig(undefined);
    }
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    if (currentScreen === Screen.HOME) {
      return <HomeScreen onNavigate={handleNavigate} />;
    }
    if (currentScreen === Screen.GAME) {
      return <GameScreen onNavigate={handleNavigate} gameConfig={gameConfig} />;
    }
    if (currentScreen === Screen.STATS) {
      return <StatsScreen onNavigate={handleNavigate} />;
    }
    return <HomeScreen onNavigate={handleNavigate} />;
  };

  return (
    <LanguageProvider>
      <UserStatsProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="light" />
          <View style={styles.container}>{renderScreen()}</View>
        </SafeAreaView>
      </UserStatsProvider>
    </LanguageProvider>
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
