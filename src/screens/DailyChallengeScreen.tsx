import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Button } from '../components/Button';
import { NavigationHandler, Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const dailyScenario = {
  opponent: {
    id: 'daily-legend',
    name: 'Valeria Stark',
    countryCode: 'SE',
    avatar: 'https://picsum.photos/200/200?random=21',
    elo: 1850,
  },
  reward: 'Emblème “Aube Royale”',
  story: 'Valeria protège la cité flottante de Solstice. Renversez-la pour gagner ses faveurs.',
  objective: 'Gagnez en moins de 5 manches pour décrocher le badge.',
  script: [
    '« Je n’ai jamais perdu un duel sous les aurores. »',
    'Valeria: “Montre-moi que les mortels peuvent manier la bataille avec honneur.”',
  ],
};

interface DailyChallengeScreenProps {
  onNavigate: NavigationHandler;
}

export const DailyChallengeScreen: React.FC<DailyChallengeScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  const startChallenge = () => {
    onNavigate(Screen.GAME, {
      gameConfig: {
        mode: 'daily',
        opponent: dailyScenario.opponent,
        metadata: {
          story: dailyScenario.story,
          objective: dailyScenario.objective,
          reward: dailyScenario.reward,
          script: dailyScenario.script,
        },
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Button size="sm" variant="ghost" onPress={() => onNavigate(Screen.HOME)}>
          <Text style={styles.backText}>{'<'} {t.return_menu}</Text>
        </Button>
        <View style={{ width: 80 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t.daily_challenge_title}</Text>
        <Text style={styles.story}>{t.daily_challenge_story}</Text>

        <View style={styles.opponentCard}>
          <Image source={{ uri: dailyScenario.opponent.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.opponentName}>{dailyScenario.opponent.name}</Text>
            <Text style={styles.opponentMeta}>{dailyScenario.opponent.elo} ELO · {dailyScenario.opponent.countryCode}</Text>
          </View>
        </View>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardLabel}>{t.challenge_reward}</Text>
          <Text style={styles.rewardValue}>{dailyScenario.reward}</Text>
        </View>

        <View style={styles.actions}>
          <Button variant="ghost" onPress={() => onNavigate(Screen.HOME)}>
            <Text style={styles.backText}>{t.back_to_modes}</Text>
          </Button>
          <Button fullWidth onPress={startChallenge}>
            <Text style={styles.startText}>{t.start_duel}</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#020617',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FDE68A',
    textAlign: 'center',
    marginBottom: 12,
  },
  story: {
    color: '#E5E7EB',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  opponentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  opponentName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  opponentMeta: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  rewardCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 24,
  },
  rewardLabel: {
    color: '#FDE68A',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  rewardValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  actions: {
    gap: 12,
  },
  backText: {
    color: '#9CA3AF',
  },
  startText: {
    color: '#000000',
    fontWeight: '700',
  },
});
