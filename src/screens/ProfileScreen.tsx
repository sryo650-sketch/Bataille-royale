import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Screen } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserStats } from '../contexts/UserStatsContext';
import { Button } from '../components/Button';
import { getFlagEmoji } from '../utils/countryUtils';
import { getUserData, updateUserData, UserData } from '../utils/onboardingUtils';

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

const placeholderAvatar = require('../assets/placeholder.png');

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { stats, updateProfile } = useUserStats();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [playerName, setPlayerName] = useState(stats.playerName ?? '');
  const [countryCode, setCountryCode] = useState(stats.countryCode ?? '');
  const [avatarUrl, setAvatarUrl] = useState(stats.avatar ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const loadUserData = async () => {
      const data = await getUserData();
      setUserData(data);
      if (data) {
        setPlayerName(data.username);
        setCountryCode(data.countryCode);
        setAvatarUrl(data.avatar || '');
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (!userData) {
      setPlayerName(stats.playerName ?? '');
      setCountryCode(stats.countryCode ?? '');
      setAvatarUrl(stats.avatar ?? '');
    }
  }, [stats.playerName, stats.countryCode, stats.avatar, userData]);

  const handleSave = async () => {
    if (!countryCode.trim()) {
      Alert.alert('Erreur', 'Le code pays est requis');
      return;
    }
    
    setStatus('saving');
    
    try {
      // Mettre à jour les données d'onboarding si elles existent
      if (userData) {
        await updateUserData({
          countryCode: countryCode.trim().toUpperCase(),
          avatar: avatarUrl.trim() || undefined,
        });
      }
      
      // Mettre à jour aussi les stats du jeu
      updateProfile({
        playerName: playerName.trim(),
        countryCode: countryCode.trim(),
        avatar: avatarUrl.trim() || undefined,
      });
      
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
      setStatus('idle');
    }
  };

  const currentFlag = getFlagEmoji(countryCode) ?? '🏳️';
  const previewSource = avatarUrl ? { uri: avatarUrl } : stats.avatar ? { uri: stats.avatar } : placeholderAvatar;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Button size="sm" variant="ghost" onPress={() => onNavigate(Screen.HOME)}>
            <Text style={styles.backText}>{'<'} {t.return_menu}</Text>
          </Button>
          <Text style={styles.headerTitle}>{t.profile_settings}</Text>
          <View style={{ width: 56 }} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatarWrapper}>
            <Image source={previewSource} style={styles.avatarImage} />
            <Text style={styles.flagBadge}>{currentFlag}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{playerName || stats.playerName}</Text>
            <Text style={styles.heroSubtitle}>{t.profile_subtitle}</Text>
          </View>
        </View>

        {userData && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Pseudo</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText}>{userData.username}</Text>
              </View>
              <Text style={styles.hint}>⚠️ Le pseudo ne peut pas être modifié</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText}>{userData.email}</Text>
              </View>
            </View>
          </>
        )}

        {!userData && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.player_name}</Text>
            <TextInput
              value={playerName}
              onChangeText={setPlayerName}
              placeholder={stats.playerName}
              placeholderTextColor="#6B7280"
              style={styles.input}
            />
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t.country_code}</Text>
          <TextInput
            value={countryCode}
            onChangeText={value => setCountryCode(value.toUpperCase().slice(0, 2))}
            placeholder="FR"
            autoCapitalize="characters"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t.avatar_url}</Text>
          <TextInput
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://"
            autoCapitalize="none"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />
        </View>

        {status === 'saved' && (
          <Text style={styles.successText}>{t.profile_saved}</Text>
        )}

        <Button
          size="lg"
          fullWidth
          onPress={handleSave}
          disabled={!playerName.trim() || status === 'saving'}
        >
          <Text style={styles.saveText}>{t.save_changes}</Text>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    color: '#9CA3AF',
  },
  headerTitle: {
    color: '#FDE68A',
    fontWeight: '800',
    fontSize: 18,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  flagBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    fontSize: 18,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 22,
  },
  heroSubtitle: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  inputDisabled: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    justifyContent: 'center',
  },
  inputDisabledText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  hint: {
    color: '#F59E0B',
    fontSize: 12,
    marginTop: 4,
  },
  saveText: {
    color: '#020617',
    fontWeight: '700',
  },
  successText: {
    color: '#22C55E',
    fontWeight: '600',
    textAlign: 'center',
  },
});
