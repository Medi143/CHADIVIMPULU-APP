import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { theme as staticTheme } from '../constants/theme';

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, setThemeMode, theme: appTheme } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: appTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: appTheme.colors.secondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={staticTheme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Preview */}
        <View style={styles.previewSection}>
          <View style={[styles.previewCard, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
            <Text style={[styles.previewTitle, { color: appTheme.colors.text }]}>Preview</Text>
            <Text style={[styles.previewText, { color: appTheme.colors.textSecondary }]}>
              This is how your app will look with the selected theme.
            </Text>
            <View style={[styles.previewBtn, { backgroundColor: appTheme.colors.secondary }]}>
              <Text style={styles.previewBtnText}>Sample Button</Text>
            </View>
          </View>
        </View>

        {/* Light Mode */}
        <TouchableOpacity
          style={[styles.themeCard, !isDark && styles.themeCardActive]}
          onPress={() => setThemeMode('light')}
          activeOpacity={0.7}
        >
          <View style={styles.themeLeft}>
            <View style={[styles.themeIcon, { backgroundColor: '#FFF9C4' }]}>
              <Ionicons name="sunny" size={28} color="#FFC107" />
            </View>
            <View>
              <Text style={styles.themeName}>Light Mode</Text>
              <Text style={styles.themeDesc}>White background, dark text</Text>
            </View>
          </View>
          {!isDark && (
            <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
          )}
        </TouchableOpacity>

        {/* Dark Mode */}
        <TouchableOpacity
          style={[styles.themeCard, isDark && styles.themeCardActiveDark]}
          onPress={() => setThemeMode('dark')}
          activeOpacity={0.7}
        >
          <View style={styles.themeLeft}>
            <View style={[styles.themeIcon, { backgroundColor: '#263238' }]}>
              <Ionicons name="moon" size={28} color="#90CAF9" />
            </View>
            <View>
              <Text style={styles.themeName}>Dark Mode</Text>
              <Text style={styles.themeDesc}>Dark background, light text</Text>
            </View>
          </View>
          {isDark && (
            <Ionicons name="checkmark-circle" size={28} color="#90CAF9" />
          )}
        </TouchableOpacity>

        <Text style={[styles.hintText, { color: appTheme.colors.textSecondary }]}>
          Theme changes are saved automatically and will persist across app restarts.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: staticTheme.spacing.md,
    paddingVertical: staticTheme.spacing.md,
  },
  backButton: {
    padding: staticTheme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: staticTheme.fontSize.xl,
    fontWeight: 'bold',
    color: staticTheme.colors.white,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: staticTheme.spacing.lg,
  },
  previewSection: {
    marginBottom: staticTheme.spacing.xl,
  },
  previewCard: {
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.lg,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: staticTheme.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: staticTheme.spacing.sm,
  },
  previewText: {
    fontSize: staticTheme.fontSize.sm,
    lineHeight: 22,
    marginBottom: staticTheme.spacing.md,
  },
  previewBtn: {
    paddingVertical: staticTheme.spacing.sm,
    paddingHorizontal: staticTheme.spacing.lg,
    borderRadius: staticTheme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  previewBtnText: {
    color: staticTheme.colors.white,
    fontWeight: '600',
    fontSize: staticTheme.fontSize.sm,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: staticTheme.colors.white,
    borderRadius: staticTheme.borderRadius.lg,
    padding: staticTheme.spacing.lg,
    marginBottom: staticTheme.spacing.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 1,
  },
  themeCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1FFF1',
  },
  themeCardActiveDark: {
    borderColor: '#90CAF9',
    backgroundColor: '#1A237E',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: staticTheme.spacing.md,
  },
  themeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeName: {
    fontSize: staticTheme.fontSize.lg,
    fontWeight: '700',
    color: staticTheme.colors.text,
  },
  themeDesc: {
    fontSize: staticTheme.fontSize.sm,
    color: staticTheme.colors.textSecondary,
    marginTop: 2,
  },
  hintText: {
    fontSize: staticTheme.fontSize.sm,
    textAlign: 'center',
    marginTop: staticTheme.spacing.lg,
    lineHeight: 22,
  },
});
