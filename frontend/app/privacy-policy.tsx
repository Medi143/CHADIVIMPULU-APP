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
import { theme } from '../constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: appTheme } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: appTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: appTheme.colors.secondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appTheme.colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: appTheme.colors.white }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.effectiveDate, { color: appTheme.colors.textSecondary }]}>Effective Date: January 1, 2026</Text>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>1.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Introduction</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>
            Chadivimpulu™ respects your privacy and is committed to protecting your personal data.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>2.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Information We Collect</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>We may collect:</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Name</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Mobile Number</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Event Details (event name, location, guest data)</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Gift Entries (amount/items)</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>3.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>How We Use Data</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>We use your data to:</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Manage events and gift entries</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Provide reports (PDF/Excel)</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Improve app performance and user experience</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>4.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Payments & Third-Party Services</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Payments are handled by third-party providers like Razorpay / UPI</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  We do NOT store: Card details, UPI PIN, Banking credentials</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>5.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Data Sharing</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  We do NOT sell or rent user data</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Data is shared only with payment providers (for transactions) and when required by law</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>6.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Data Security</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  We implement industry-standard security practices</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  However, no system is 100% secure</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>7.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>User Rights</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>Users can:</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Request data deletion</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Update their personal details</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Contact support for privacy concerns</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>8.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Children's Privacy</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>
            This app is not intended for children under 13 years of age.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>9.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Changes to Privacy Policy</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>
            We may update this policy periodically. Users will be notified of major changes.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>10.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Contact Us</Text>
          <Text style={[styles.contactEmail, { color: appTheme.colors.secondary }]}>support@chadivimpulu.com</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: { padding: theme.spacing.sm },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: theme.spacing.lg },
  effectiveDate: {
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
  },
  sectionNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  bodyText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 22,
  },
  bulletList: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  bulletText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 22,
    paddingLeft: 4,
  },
  contactEmail: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
});
