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

export default function Events() {
  const router = useRouter();
  const { user, activeEvent, setActiveEvent } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
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

      {/* Search Event & Send Gift */}
      <TouchableOpacity
        style={styles.searchEventBtn}
        onPress={() => router.push('/search-event')}
        activeOpacity={0.7}
      >
        <View style={styles.searchEventBtnInner}>
          <Ionicons name="search" size={22} color={theme.colors.secondary} />
          <View style={styles.searchEventBtnText}>
            <Text style={styles.searchEventTitle}>Search Event & Send Gift</Text>
            <Text style={styles.searchEventSubtitle}>Send Chadivimpulu to any event remotely</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>

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
  searchEventBtn: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    overflow: 'hidden',
  },
  searchEventBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: 12,
  },
  searchEventBtnText: {
    flex: 1,
  },
  searchEventTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  searchEventSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
