import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, useThemeColor } from '../contexts/ThemeContext';
import { NavigationHandler, Screen } from '../types';
import { ThemeColors } from '../theme';

interface SettingsScreenProps {
  onNavigate: NavigationHandler;
}

type MenuItem = {
  icon: string;
  titleFr: string;
  titleEn: string;
  onPress: () => void;
  section?: 'profile' | 'preferences' | 'info';
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { toggle } = useTheme();
  const colors = useThemeColor();
  const styles = createStyles(colors);

  const menuItems: MenuItem[] = [
    // Section Profil & Stats
    {
      icon: '👤',
      titleFr: 'Mon Profil',
      titleEn: 'My Profile',
      onPress: () => onNavigate(Screen.PROFILE),
      section: 'profile',
    },
    {
      icon: '🏆',
      titleFr: 'Classement',
      titleEn: 'Leaderboard',
      onPress: () => onNavigate(Screen.STATS),
      section: 'profile',
    },
    {
      icon: '📊',
      titleFr: 'Statistiques',
      titleEn: 'Statistics',
      onPress: () => onNavigate(Screen.STATS),
      section: 'profile',
    },
    // Section Préférences
    {
      icon: '🌓',
      titleFr: 'Thème',
      titleEn: 'Theme',
      onPress: toggle,
      section: 'preferences',
    },
    {
      icon: '🔔',
      titleFr: 'Notifications',
      titleEn: 'Notifications',
      onPress: () => {}, // À implémenter
      section: 'preferences',
    },
    // Section Informations
    {
      icon: '📜',
      titleFr: 'Mentions légales',
      titleEn: 'Legal Notice',
      onPress: () => {}, // À implémenter
      section: 'info',
    },
    {
      icon: '📧',
      titleFr: 'Contact & Support',
      titleEn: 'Contact & Support',
      onPress: () => {}, // À implémenter
      section: 'info',
    },
    {
      icon: '❓',
      titleFr: 'Aide & Tutoriel',
      titleEn: 'Help & Tutorial',
      onPress: () => {}, // À implémenter
      section: 'info',
    },
    {
      icon: 'ℹ️',
      titleFr: 'À propos',
      titleEn: 'About',
      onPress: () => {}, // À implémenter
      section: 'info',
    },
  ];

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'profile':
        return language === 'fr' ? 'Profil & Statistiques' : 'Profile & Statistics';
      case 'preferences':
        return language === 'fr' ? 'Préférences' : 'Preferences';
      case 'info':
        return language === 'fr' ? 'Informations' : 'Information';
      default:
        return '';
    }
  };

  const renderSection = (section: 'profile' | 'preferences' | 'info') => {
    const items = menuItems.filter(item => item.section === section);
    
    return (
      <View key={section} style={styles.section}>
        <Text style={styles.sectionTitle}>{getSectionTitle(section)}</Text>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>
                {language === 'fr' ? item.titleFr : item.titleEn}
              </Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onNavigate(Screen.HOME)}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'fr' ? 'Paramètres' : 'Settings'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {renderSection('profile')}
        {renderSection('preferences')}
        {renderSection('info')}

        <View style={styles.footer}>
          <Text style={styles.version}>Pugna Regalis v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 Edition Royale</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceAlt,
    },
    backButton: {
      padding: 8,
    },
    backText: {
      fontSize: 24,
      color: colors.text,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 48,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.surfaceAlt,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    menuIcon: {
      fontSize: 24,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    menuArrow: {
      fontSize: 20,
      color: colors.textSecondary,
    },
    footer: {
      alignItems: 'center',
      marginTop: 32,
      paddingVertical: 24,
    },
    version: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    copyright: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
