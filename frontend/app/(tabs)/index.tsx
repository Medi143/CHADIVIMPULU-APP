import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DashboardStats {
  total_guests: number;
  total_cash: number;
  total_items: number;
  bride_side: { guests: number; cash: number };
  groom_side: { guests: number; cash: number };
  payment_modes: { cash: number; upi: number };
  recent_entries: any[];
}

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);

  useEffect(() => {
    loadEventAndStats();
  }, []);

  const loadEventAndStats = async () => {
    try {
      // Check if user has an event
      if (!user?.current_event_id) {
        // Prompt to create event
        setLoading(false);
        return;
      }

      // Fetch event details
      const eventResponse = await fetch(
        `${BACKEND_URL}/api/events/${user.current_event_id}`
      );
      const eventData = await eventResponse.json();

      if (eventData.success) {
        setCurrentEvent(eventData.event);
      }

      // Fetch dashboard stats
      const statsResponse = await fetch(
        `${BACKEND_URL}/api/dashboard/${user.current_event_id}`
      );
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEventAndStats();
  };

  const createEvent = () => {
    router.push('/create-event');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user?.current_event_id || !currentEvent) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={80} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Event Created</Text>
        <Text style={styles.emptyText}>Create your first wedding event to start tracking gifts</Text>
        <TouchableOpacity style={styles.createButton} onPress={createEvent}>
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.eventCard}>
        <Text style={styles.eventName}>{currentEvent.name}</Text>
        <Text style={styles.eventDetails}>
          {currentEvent.date} • {currentEvent.location}
        </Text>
        <Text style={styles.eventCode}>Code: {currentEvent.code}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="people" size={32} color="#4CAF50" />
          <Text style={styles.statValue}>{stats?.total_guests || 0}</Text>
          <Text style={styles.statLabel}>Total Guests</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="cash" size={32} color="#FF9800" />
          <Text style={styles.statValue}>₹{stats?.total_cash.toLocaleString() || 0}</Text>
          <Text style={styles.statLabel}>Total Cash</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="gift" size={32} color="#2196F3" />
          <Text style={styles.statValue}>{stats?.total_items || 0}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
          <Ionicons name="card" size={32} color="#9C27B0" />
          <Text style={styles.statValue}>{stats?.payment_modes.upi || 0}</Text>
          <Text style={styles.statLabel}>UPI Payments</Text>
        </View>
      </View>

      <View style={styles.sideComparison}>
        <View style={styles.sideCard}>
          <Text style={styles.sideTitle}>Bride's Side</Text>
          <Text style={styles.sideGuests}>{stats?.bride_side.guests || 0} guests</Text>
          <Text style={styles.sideCash}>₹{stats?.bride_side.cash.toLocaleString() || 0}</Text>
        </View>
        <View style={styles.sideCard}>
          <Text style={styles.sideTitle}>Groom's Side</Text>
          <Text style={styles.sideGuests}>{stats?.groom_side.guests || 0} guests</Text>
          <Text style={styles.sideCash}>₹{stats?.groom_side.cash.toLocaleString() || 0}</Text>
        </View>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {stats?.recent_entries && stats.recent_entries.length > 0 ? (
          stats.recent_entries.map((entry, index) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryName}>{entry.guest_name}</Text>
                <Text style={styles.entrySide}>{entry.side}</Text>
              </View>
              <View style={styles.entryDetails}>
                <Text style={styles.entryType}>
                  {entry.gift_type === 'cash' ? `₹${entry.amount}` : entry.item_description}
                </Text>
                <Text style={styles.entryMode}>{entry.payment_mode}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No entries yet</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/gifts')}
      >
        <Ionicons name="add" size={32} color={theme.colors.white} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  createButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.secondary,
  },
  greeting: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.8,
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  eventCard: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
  },
  eventName: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventDetails: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  eventCode: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
  },
  statCard: {
    width: '48%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    marginHorizontal: '1%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  sideComparison: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sideCard: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sideTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sideGuests: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  sideCash: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    marginTop: theme.spacing.xs,
  },
  recentSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  entryCard: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  entryName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  entrySide: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryType: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  entryMode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
