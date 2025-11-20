import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme, useThemeColor } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { UserStatsProvider } from './src/contexts/UserStatsContext';
import { NavigationHandler, Screen } from './src/types';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const AppNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const colors = useThemeColor();
  const { effective } = useTheme();

  const handleNavigate: NavigationHandler = screen => {
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    if (currentScreen === Screen.HOME) {
      return <HomeScreen onNavigate={handleNavigate} />;
    }
    if (currentScreen === Screen.GAME) {
      return <GameScreen onNavigate={handleNavigate} />;
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
        <UserStatsProvider>
          <SafeAreaProvider>
            <AppNavigator />
          </SafeAreaProvider>
        </UserStatsProvider>
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
