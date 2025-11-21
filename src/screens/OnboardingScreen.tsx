import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as ImagePicker from 'expo-image-picker'; // TODO: Install expo-image-picker
import { Button } from '../components/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeColor } from '../contexts/ThemeContext';
import { ThemeColors } from '../theme';

const ONBOARDING_KEY = 'hasCompletedOnboarding';
const USER_DATA_KEY = 'userData';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('FR');

  const pickImage = async () => {
    // TODO: Implement image picker when expo-image-picker is installed
    Alert.alert('Bientôt disponible', 'La fonctionnalité d\'upload de photo sera disponible prochainement');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!username.trim()) {
        Alert.alert('Pseudo requis', 'Veuillez entrer un pseudo');
        return;
      }
      if (username.trim().length < 3) {
        Alert.alert('Pseudo trop court', 'Le pseudo doit contenir au moins 3 caractères');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email.trim()) {
        Alert.alert('Email requis', 'Veuillez entrer votre email');
        return;
      }
      if (!validateEmail(email)) {
        Alert.alert('Email invalide', 'Veuillez entrer un email valide');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      const userData = {
        username: username.trim(),
        email: email.trim(),
        avatar: avatar || undefined,
        countryCode: countryCode.toUpperCase(),
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder vos données');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>👋</Text>
      <Text style={styles.title}>Bienvenue sur Pugna Regalis !</Text>
      <Text style={styles.subtitle}>
        Choisis ton pseudo de guerrier
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Ton pseudo"
        placeholderTextColor={colors.textSecondary}
        value={username}
        onChangeText={setUsername}
        maxLength={20}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Text style={styles.hint}>
        ⚠️ Le pseudo ne pourra plus être modifié après l'inscription
      </Text>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>📧</Text>
      <Text style={styles.title}>Ton email</Text>
      <Text style={styles.subtitle}>
        Pour te connecter et récupérer ton compte
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="email@exemple.com"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Text style={styles.hint}>
        🔒 Ton email reste privé et sécurisé
      </Text>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.emoji}>🎨</Text>
      <Text style={styles.title}>Personnalise ton profil</Text>
      <Text style={styles.subtitle}>
        Ajoute une photo et ton pays
      </Text>
      
      <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>📷</Text>
            <Text style={styles.avatarPlaceholderLabel}>Ajouter une photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Code pays (ex: FR, US, JP)"
        placeholderTextColor={colors.textSecondary}
        value={countryCode}
        onChangeText={setCountryCode}
        maxLength={2}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      
      <Text style={styles.hint}>
        ✨ Tu pourras modifier ta photo plus tard
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
        <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <View style={styles.actions}>
        {step > 1 && (
          <Button variant="outline" onPress={() => setStep(step - 1)}>
            <Text style={styles.backButtonText}>Retour</Text>
          </Button>
        )}
        <Button onPress={handleNext} fullWidth={step === 1}>
          <Text style={styles.nextButtonText}>
            {step === 3 ? 'Commencer !' : 'Suivant'}
          </Text>
        </Button>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
    },
    progressBar: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 40,
    },
    progressStep: {
      flex: 1,
      height: 4,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 2,
    },
    progressStepActive: {
      backgroundColor: colors.gold,
    },
    stepContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: {
      fontSize: 64,
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
      textAlign: 'center',
    },
    input: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.surfaceAlt,
      marginBottom: 16,
    },
    hint: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    avatarPicker: {
      width: 120,
      height: 120,
      borderRadius: 60,
      marginBottom: 24,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.gold,
      borderStyle: 'dashed',
    },
    avatarPlaceholderText: {
      fontSize: 40,
      marginBottom: 8,
    },
    avatarPlaceholderLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    backButtonText: {
      color: colors.gold,
      fontWeight: '700',
    },
    nextButtonText: {
      color: colors.black,
      fontWeight: '700',
      fontSize: 16,
    },
  });
