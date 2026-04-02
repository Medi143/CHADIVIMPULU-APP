import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { theme } from '../constants/theme';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (lang: 'en' | 'te') => {
    setLanguage(lang);
    Alert.alert(
      lang === 'en' ? 'Language Changed' : 'భాష మార్చబడింది',
      lang === 'en' ? 'App language set to English' : 'యాప్ భాష తెలుగుకు మార్చబడింది',
      [{ text: lang === 'en' ? 'OK' : 'సరే' }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.language')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info */}
        <View style={styles.infoBanner}>
          <Ionicons name="language" size={28} color={theme.colors.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Select Language / భాష ఎంచుకోండి</Text>
            <Text style={styles.infoSubtext}>Choose your preferred language</Text>
          </View>
        </View>

        {/* English */}
        <TouchableOpacity
          style={[styles.langCard, language === 'en' && styles.langCardActive]}
          onPress={() => handleLanguageChange('en')}
          activeOpacity={0.7}
        >
          <View style={styles.langLeft}>
            <Text style={styles.langFlag}>EN</Text>
            <View>
              <Text style={styles.langName}>English</Text>
              <Text style={styles.langNative}>English</Text>
            </View>
          </View>
          {language === 'en' && (
            <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
          )}
        </TouchableOpacity>

        {/* Telugu */}
        <TouchableOpacity
          style={[styles.langCard, language === 'te' && styles.langCardActive]}
          onPress={() => handleLanguageChange('te')}
          activeOpacity={0.7}
        >
          <View style={styles.langLeft}>
            <Text style={styles.langFlag}>TE</Text>
            <View>
              <Text style={styles.langName}>Telugu</Text>
              <Text style={styles.langNative}>తెలుగు</Text>
            </View>
          </View>
          {language === 'te' && (
            <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
          )}
        </TouchableOpacity>

        <Text style={styles.hintText}>
          The app interface will update immediately after selection.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 1,
  },
  langCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1FFF1',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  langFlag: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    backgroundColor: theme.colors.secondary,
    width: 48,
    height: 48,
    borderRadius: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 48,
    overflow: 'hidden',
  },
  langName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
  },
  langNative: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  hintText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    lineHeight: 22,
  },
});
