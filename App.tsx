import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { UserStatsProvider } from './src/contexts/UserStatsContext';
import { Screen } from './src/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { StatsScreen } from './src/screens/StatsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);

  const renderScreen = () => {
    if (currentScreen === Screen.HOME) {
      return <HomeScreen onNavigate={setCurrentScreen} />;
    }
    if (currentScreen === Screen.GAME) {
      return <GameScreen onNavigate={setCurrentScreen} />;
    }
    if (currentScreen === Screen.STATS) {
      return <StatsScreen onNavigate={setCurrentScreen} />;
    }
    return <HomeScreen onNavigate={setCurrentScreen} />;
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
