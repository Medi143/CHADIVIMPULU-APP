import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

export default function AboutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* App Icon */}
        <View style={styles.appIconSection}>
          <View style={styles.appIcon}>
            <Ionicons name="gift" size={50} color={theme.colors.white} />
          </View>
          <Text style={styles.appName}>Chadivimpulu</Text>
          <Text style={styles.appTagline}>The Digital Wed Gift Registry</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About the App</Text>
          <Text style={styles.cardText}>
            Chadivimpulu is a modern mobile app designed for Indian weddings to digitally record and manage gift entries. It replaces traditional manual writing systems with a fast and efficient digital solution, making it ideal for handling gift records smoothly at wedding events.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={20} color="#FF9800" />
              <Text style={styles.featureText}>Lightning-fast gift entry</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Multi-role access (Admin, Staff, Viewer)</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="analytics" size={20} color="#2196F3" />
              <Text style={styles.featureText}>Real-time reports & analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="document-text" size={20} color="#F44336" />
              <Text style={styles.featureText}>PDF & Excel export</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar" size={20} color="#9C27B0" />
              <Text style={styles.featureText}>Multiple event management</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="phone-portrait" size={20} color="#009688" />
              <Text style={styles.featureText}>Cash & UPI payment tracking</Text>
            </View>
          </View>
        </View>

        {/* Developer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Developer</Text>
          <View style={styles.devInfo}>
            <View style={styles.devAvatar}>
              <Ionicons name="code-slash" size={28} color={theme.colors.white} />
            </View>
            <View style={styles.devDetails}>
              <Text style={styles.devName}>Chadivimpulu Team</Text>
              <Text style={styles.devDesc}>Crafted with love for Indian weddings</Text>
            </View>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.legalSection}>
          <TouchableOpacity style={styles.legalItem} onPress={() => router.push('/terms-of-service')}>
            <Ionicons name="document-text-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.legalText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalItem} onPress={() => router.push('/privacy-policy')}>
            <Ionicons name="shield-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>{'\u00A9'}2026 Chadivimpulu{'\u2122'}. All rights reserved.</Text>

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
  appIconSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  appName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  appTagline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  versionBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
  },
  versionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  cardText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  featureList: {
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  devInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  devAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  devDetails: {
    flex: 1,
  },
  devName: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  devDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  legalSection: {
    marginBottom: theme.spacing.lg,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  legalText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  copyright: {
    textAlign: 'center',
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});
