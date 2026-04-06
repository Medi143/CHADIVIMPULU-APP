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

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme: appTheme } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: appTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: appTheme.colors.secondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appTheme.colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: appTheme.colors.white }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.effectiveDate, { color: appTheme.colors.textSecondary }]}>Effective Date: January 1, 2026</Text>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>1.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Introduction</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>
            Welcome to Chadivimpulu™. This application is designed to help users digitally record and manage gift entries for events such as weddings, birthdays, and other occasions.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>2.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Acceptance of Terms</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>
            By accessing or using the Chadivimpulu app, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>3.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>User Responsibilities</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Users must provide accurate and complete information (name, mobile number, event details, gift entries).</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Users are solely responsible for the data they enter into the platform.</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Any misuse, fraud, or illegal activity is strictly prohibited.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>4.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Payments & Transactions</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Chadivimpulu may integrate third-party payment gateways (such as UPI and Razorpay).</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  All financial transactions are processed by these third-party providers.</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Chadivimpulu does not store sensitive payment information (card/UPI credentials).</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  The platform is not responsible for payment failures, delays, or disputes.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>5.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Data & Records</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Gift entries and event data are stored digitally for user convenience.</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Users are responsible for verifying the accuracy of recorded data.</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Chadivimpulu is not liable for any loss caused by incorrect entries.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>6.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Limitation of Liability</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>
            Chadivimpulu is provided "as is" without warranties of any kind. We are not responsible for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Data loss due to technical issues</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Financial disputes between users and guests</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Misuse of the platform</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>7.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Account Usage</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Users must not share their account access with unauthorized persons.</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  We reserve the right to suspend or terminate accounts in case of misuse.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>8.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Updates & Modifications</Text>
          <View style={styles.bulletList}>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  We may update these Terms at any time.</Text>
            <Text style={[styles.bulletText, { color: appTheme.colors.textSecondary }]}>•  Continued use of the app means acceptance of updated terms.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sectionNumber, { color: appTheme.colors.primary }]}>9.</Text>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>Contact Information</Text>
          <Text style={[styles.bodyText, { color: appTheme.colors.textSecondary }]}>For any queries:</Text>
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
