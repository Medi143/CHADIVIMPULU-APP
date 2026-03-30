import React, { useState, useEffect, useCallback } from 'react';
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

export default function Events() {
  const router = useRouter();
  const { user, activeEvent, setActiveEvent } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user?._id, activeEvent?._id]);

  const loadData = async () => {
    try {
      // Load events list
      if (user?._id) {
        const eventsResponse = await fetch(
          `${BACKEND_URL}/api/events?user_id=${user._id}`
        );
        const eventsData = await eventsResponse.json();
        if (eventsData.success) {
          setEvents(eventsData.events || []);
        }
      }

      // Load stats for active event
      const eventId = activeEvent?._id || user?.current_event_id;
      if (eventId) {
        const statsResponse = await fetch(
          `${BACKEND_URL}/api/dashboard/${eventId}`
        );
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [user?._id, activeEvent?._id]);

  const handleSelectEvent = async (event: any) => {
    await setActiveEvent(event);
    Alert.alert(
      'Event Switched',
      `Active event set to "${event.name}"`,
      [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const currentEventId = activeEvent?._id || user?.current_event_id;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Summary for Active Event */}
      {stats && (
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="people" size={28} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.total_guests}</Text>
              <Text style={styles.statLabel}>Total Guests</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="cash" size={28} color="#FF9800" />
              <Text style={styles.statValue}>
                {'\u20b9'}{stats.total_cash.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Cash</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="gift" size={28} color="#2196F3" />
              <Text style={styles.statValue}>{stats.total_items}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="card" size={28} color="#9C27B0" />
              <Text style={styles.statValue}>{stats.payment_modes.upi}</Text>
              <Text style={styles.statLabel}>UPI Payments</Text>
            </View>
          </View>

          {/* Bride/Groom side comparison */}
          <View style={styles.sideComparison}>
            <View style={styles.sideCard}>
              <Text style={styles.sideTitle}>Bride's Side</Text>
              <Text style={styles.sideGuests}>
                {stats.bride_side.guests} guests
              </Text>
              <Text style={styles.sideCash}>
                {'\u20b9'}{stats.bride_side.cash.toLocaleString()}
              </Text>
            </View>
            <View style={styles.sideCard}>
              <Text style={styles.sideTitle}>Groom's Side</Text>
              <Text style={styles.sideGuests}>
                {stats.groom_side.guests} guests
              </Text>
              <Text style={styles.sideCash}>
                {'\u20b9'}{stats.groom_side.cash.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Events List */}
      <View style={styles.eventsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Events</Text>
          <TouchableOpacity
            style={styles.newEventBtn}
            onPress={() => router.push('/create-event')}
          >
            <Ionicons name="add" size={18} color={theme.colors.white} />
            <Text style={styles.newEventBtnText}>New Event</Text>
          </TouchableOpacity>
        </View>

        {events.length > 0 ? (
          events.map((event, index) => {
            const isActive = event._id === currentEventId;
            return (
              <TouchableOpacity
                key={event._id || index}
                style={[styles.eventCard, isActive && styles.eventCardActive]}
                onPress={() => handleSelectEvent(event)}
              >
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                )}
                <Text style={styles.eventName}>{event.name}</Text>
                <View style={styles.eventMeta}>
                  <View style={styles.eventMetaItem}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.eventMetaText}>{event.date}</Text>
                  </View>
                  <View style={styles.eventMetaItem}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.eventMetaText}>{event.location}</Text>
                  </View>
                </View>
                {event.code && (
                  <View style={styles.eventCodeRow}>
                    <Ionicons name="key-outline" size={14} color={theme.colors.secondary} />
                    <Text style={styles.eventCodeText}>
                      Code: {event.code}
                    </Text>
                  </View>
                )}
                <View style={styles.eventStats}>
                  <View style={styles.eventStat}>
                    <Ionicons name="people-outline" size={16} color="#4CAF50" />
                    <Text style={styles.eventStatText}>
                      {event.guest_count || 0} guests
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyEvents}>
            <Ionicons
              name="calendar-outline"
              size={60}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>No events yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-event')}
            >
              <Text style={styles.createButtonText}>Create Your First Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent Entries */}
      {stats?.recent_entries && stats.recent_entries.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {stats.recent_entries.slice(0, 5).map((entry: any, index: number) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.entryRow}>
                <Text style={styles.entryName}>{entry.guest_name}</Text>
                <Text style={styles.entryAmount}>
                  {entry.gift_type === 'cash'
                    ? `\u20b9${(entry.amount || 0).toLocaleString()}`
                    : entry.item_description || 'Item'}
                </Text>
              </View>
              <View style={styles.entryRow}>
                <Text style={styles.entrySide}>{entry.side} side</Text>
                <View
                  style={[
                    styles.entryModeBadge,
                    {
                      backgroundColor:
                        entry.payment_mode === 'upi' ? '#E8F5E9' : '#FFF3E0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.entryModeText,
                      {
                        color:
                          entry.payment_mode === 'upi' ? '#4CAF50' : '#FF8C00',
                      },
                    ]}
                  >
                    {(entry.payment_mode || '').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
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
  statsSection: {
    padding: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
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
  // Events section
  eventsSection: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  newEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  newEventBtnText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventCardActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#FFFDE7',
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  eventName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  eventCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  eventCodeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  eventStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventStatText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  emptyEvents: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  createButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  // Recent entries
  recentSection: {
    padding: theme.spacing.lg,
  },
  entryCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  entryAmount: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  entrySide: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  entryModeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  entryModeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
