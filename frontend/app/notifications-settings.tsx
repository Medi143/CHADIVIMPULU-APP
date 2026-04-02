import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';

const STORAGE_KEY = 'notification_prefs';

interface NotifPrefs {
  eventUpdates: boolean;
  giftAlerts: boolean;
  payments: boolean;
}

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<NotifPrefs>({
    eventUpdates: true,
    giftAlerts: true,
    payments: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrefs(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading notification prefs:', e);
    }
  };

  const updatePref = async (key: keyof NotifPrefs, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Error saving notification prefs:', e);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="notifications" size={28} color={theme.colors.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Notification Preferences</Text>
            <Text style={styles.infoSubtext}>Choose which alerts you want to receive</Text>
          </View>
        </View>

        {/* Toggle Items */}
        <View style={styles.section}>
          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="calendar" size={22} color="#2196F3" />
              </View>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Event Updates</Text>
                <Text style={styles.toggleDesc}>Get notified about event changes and updates</Text>
              </View>
            </View>
            <Switch
              value={prefs.eventUpdates}
              onValueChange={(val) => updatePref('eventUpdates', val)}
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={prefs.eventUpdates ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="gift" size={22} color="#FF9800" />
              </View>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>New Gift Entry Alerts</Text>
                <Text style={styles.toggleDesc}>Alert when a new gift is recorded</Text>
              </View>
            </View>
            <Switch
              value={prefs.giftAlerts}
              onValueChange={(val) => updatePref('giftAlerts', val)}
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={prefs.giftAlerts ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="card" size={22} color="#4CAF50" />
              </View>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Payment Notifications</Text>
                <Text style={styles.toggleDesc}>Get notified for UPI and cash payments</Text>
              </View>
            </View>
            <Switch
              value={prefs.payments}
              onValueChange={(val) => updatePref('payments', val)}
              trackColor={{ false: '#E0E0E0', true: '#81C784' }}
              thumbColor={prefs.payments ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Save Confirmation */}
        {saved && (
          <View style={styles.savedBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.savedText}>Preferences saved!</Text>
          </View>
        )}

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
  section: {
    gap: theme.spacing.sm,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  toggleDesc: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  savedText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
