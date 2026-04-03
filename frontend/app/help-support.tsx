import React, { useState } from 'react';
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

const FAQ_DATA = [
  {
    question: 'How do I create a new event?',
    answer: 'Go to the Events tab and tap "New Event". Fill in the event details like name, date, location, and event type. Then tap Create.',
  },
  {
    question: 'How do I add a gift entry?',
    answer: 'Navigate to the Gifts tab and tap the + button. Enter the guest name, select the amount, choose cash/UPI mode, pick the side (Bride/Groom), and submit.',
  },
  {
    question: 'Can I export reports?',
    answer: 'Yes! Go to the Reports tab and scroll to the bottom. You can export as PDF or Excel. The files can be shared or saved to your device.',
  },
  {
    question: 'How do I add staff members?',
    answer: 'Go to Settings > Manage Staff. Enter their phone number, select their role (Staff or Admin), and tap Add Staff. They can then access the event on their device.',
  },
  {
    question: 'How do I switch between events?',
    answer: 'Go to the Events tab and tap on the event you want to switch to. The selected event will be marked as ACTIVE.',
  },
  {
    question: 'Is my data safe?',
    answer: 'Yes, all your data is securely stored in our database. Only you and your authorized staff can access your event data.',
  },
  {
    question: 'Can I use the app without internet?',
    answer: 'Currently, an internet connection is required to sync data. Offline support will be available in a future update.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Ionicons name="headset" size={36} color={theme.colors.secondary} />
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactSubtitle}>We're here to assist you</Text>

          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactButton}
      onPress={() => Linking.openURL('mailto:support@chadivimpulu.app')}
            >
              <Ionicons name="mail" size={20} color={theme.colors.white} />
              <Text style={styles.contactBtnText}>Email Us</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => Linking.openURL('tel:+919876543210')}
            >
              <Ionicons name="call" size={20} color={theme.colors.white} />
              <Text style={styles.contactBtnText}>Call Us</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactDetails}>
            <View style={styles.contactDetailRow}>
              <Ionicons name="mail-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.contactDetailText}>support@chadivimpulu.app</Text>
            </View>
            <View style={styles.contactDetailRow}>
              <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.contactDetailText}>+91 98765 43210</Text>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {FAQ_DATA.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqCard}
            onPress={() => toggleFAQ(index)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Ionicons
                name="help-circle"
                size={22}
                color={expandedIndex === index ? theme.colors.secondary : theme.colors.textSecondary}
              />
              <Text style={[
                styles.faqQuestion,
                expandedIndex === index && styles.faqQuestionActive,
              ]}>
                {faq.question}
              </Text>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
            {expandedIndex === index && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

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
  contactCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  contactTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  contactSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: theme.spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  contactBtnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.white,
  },
  contactDetails: {
    gap: theme.spacing.sm,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  contactDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  faqCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  faqQuestionActive: {
    color: theme.colors.secondary,
  },
  faqAnswer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    paddingTop: 0,
    marginLeft: 30,
  },
  faqAnswerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});
