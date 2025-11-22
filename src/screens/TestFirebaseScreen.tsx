// src/screens/TestFirebaseScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

export const TestFirebaseScreen: React.FC = () => {
  const { signUp, signIn, signOut, currentUser, userProfile } = useAuth();
  const [email, setEmail] = useState('test@pugnaregalis.com');
  const [password, setPassword] = useState('Test1234!');
  const [name, setName] = useState('Test User');

  const handleSignUp = async () => {
    try {
      await signUp(email, password, name, 'FR');
      Alert.alert('✅ Inscription réussie !');
    } catch (error: any) {
      Alert.alert('❌ Erreur', error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      Alert.alert('✅ Connexion réussie !');
    } catch (error: any) {
      Alert.alert('❌ Erreur', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('✅ Déconnexion réussie !');
    } catch (error: any) {
      Alert.alert('❌ Erreur', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Test Firebase</Text>

      {currentUser ? (
        <View style={styles.userInfo}>
          <Text style={styles.label}>✅ Connecté</Text>
          <Text style={styles.value}>Email: {currentUser.email}</Text>
          <Text style={styles.value}>UID: {currentUser.uid}</Text>
          {userProfile && (
            <>
              <Text style={styles.value}>Nom: {userProfile.name}</Text>
              <Text style={styles.value}>ELO: {userProfile.elo}</Text>
            </>
          )}
          <Button onPress={handleSignOut} style={styles.button}>
            <Text style={styles.buttonText}>Déconnexion</Text>
          </Button>
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Nom"
            value={name}
            onChangeText={setName}
          />
          <Button onPress={handleSignUp} style={styles.button}>
            <Text style={styles.buttonText}>Inscription</Text>
          </Button>
          <Button onPress={handleSignIn} variant="outline" style={styles.button}>
            <Text style={styles.buttonText}>Connexion</Text>
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a3f5f',
  },
  button: {
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  userInfo: {
    backgroundColor: '#16213e',
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
