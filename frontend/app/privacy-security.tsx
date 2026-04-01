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
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const handleLogoutAll = () => {
    Alert.alert(
      'Logout from All Devices',
      'This will log you out from all devices. You will need to login again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all events, gifts, and data. This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'Are you ABSOLUTELY sure? All your data will be lost permanently.',
      [
        { text: 'No, Keep Account', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/users/${user?._id}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (data.success) {
                await logout();
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                router.replace('/login');
              } else {
                throw new Error(data.detail || 'Failed to delete account');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Account Info */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={28} color="#4CAF50" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Account Secured</Text>
            <Text style={styles.infoSubtitle}>
              Your account is protected with instant phone-based login. No passwords needed.
            </Text>
          </View>
        </View>

        {/* Session Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SESSION MANAGEMENT</Text>

          <View style={styles.sessionCard}>
            <View style={styles.sessionInfo}>
              <Ionicons name="phone-portrait" size={22} color={theme.colors.secondary} />
              <View style={styles.sessionText}>
                <Text style={styles.sessionDevice}>Current Device</Text>
                <Text style={styles.sessionStatus}>Active Now</Text>
              </View>
            </View>
            <View style={styles.activeDot} />
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogoutAll}>
            <Ionicons name="log-out-outline" size={22} color="#FF6B00" />
            <Text style={styles.actionButtonText}>Logout from All Devices</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA & PRIVACY</Text>

          <View style={styles.privacyItem}>
            <Ionicons name="cloud-done-outline" size={22} color="#4CAF50" />
            <View style={styles.privacyText}>
              <Text style={styles.privacyTitle}>Data Storage</Text>
              <Text style={styles.privacyDesc}>Your data is stored securely in our database</Text>
            </View>
          </View>

          <View style={styles.privacyItem}>
            <Ionicons name="eye-off-outline" size={22} color="#2196F3" />
            <View style={styles.privacyText}>
              <Text style={styles.privacyTitle}>Privacy</Text>
              <Text style={styles.privacyDesc}>Only you and your staff can access event data</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>DANGER ZONE</Text>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={22} color={theme.colors.white} />
            <Text style={styles.deleteButtonText}>Delete My Account</Text>
          </TouchableOpacity>
          <Text style={styles.deleteWarning}>
            This will permanently remove all your events, gift entries, staff data, and account.
          </Text>
        </View>

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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
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
    color: '#2E7D32',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: theme.fontSize.sm,
    color: '#4CAF50',
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  sessionText: {},
  sessionDevice: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sessionStatus: {
    fontSize: theme.fontSize.sm,
    color: '#4CAF50',
    marginTop: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: theme.spacing.md,
  },
  actionButtonText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: '#FF6B00',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: theme.spacing.md,
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  privacyDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  deleteButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.white,
  },
  deleteWarning: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 18,
  },
});
