import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL
  || process.env.EXPO_PUBLIC_BACKEND_URL
  || '';

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  housewarming: 'Housewarming',
  babyshower: 'Baby Shower',
  naming: 'Naming Ceremony',
  birthday: 'Birthday',
  sashtipoorthi: 'Sashtipoorthi',
  halfsaree: 'Half Saree',
};

export default function SearchEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchEvents = useCallback(async (searchText: string) => {
    if (!searchText || searchText.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const resp = await fetch(
        `${BACKEND_URL}/api/events/search?q=${encodeURIComponent(searchText.trim())}`
      );
      const data = await resp.json();
      if (data.success) {
        setResults(data.events);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchEvents(text), 400);
  };

  const handleSendGift = (event: any) => {
    router.push({
      pathname: '/send-gift',
      params: {
        eventId: event._id,
        eventName: event.name,
        eventType: event.event_type,
        eventLocation: event.location,
        eventDate: event.date,
      },
    });
  };

  const renderEventCard = ({ item }: { item: any }) => {
    const displayName = item.bride_name && item.groom_name
      ? `${item.bride_name} & ${item.groom_name}`
      : item.event_person_name || item.name;

    return (
      <View style={styles.eventCard}>
        {item.couple_photo ? (
          <Image source={{ uri: item.couple_photo }} style={styles.couplePhoto} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="people" size={36} color={theme.colors.textSecondary} />
          </View>
        )}
        <View style={styles.eventInfo}>
          <Text style={styles.eventName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.eventMeta}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {EVENT_TYPE_LABELS[item.event_type] || item.event_type}
              </Text>
            </View>
          </View>
          {displayName !== item.name && (
            <Text style={styles.coupleNames} numberOfLines={1}>{displayName}</Text>
          )}
          <View style={styles.eventDetailRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.eventDetailText} numberOfLines={1}>{item.location || 'N/A'}</Text>
          </View>
          <View style={styles.eventDetailRow}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.eventDetailText}>{item.date || 'N/A'}</Text>
          </View>
          {item.phone_masked ? (
            <View style={styles.eventDetailRow}>
              <Ionicons name="call-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.eventDetailText}>{item.phone_masked}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.sendGiftBtn}
          onPress={() => handleSendGift(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="gift" size={18} color={theme.colors.white} />
          <Text style={styles.sendGiftBtnText}>Send Gift</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Event & Send Gift</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Event Name / Location / Phone Number"
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.searchingText}>Searching events...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderEventCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : searched ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={64} color={theme.colors.border} />
          <Text style={styles.noResultsTitle}>No events found</Text>
          <Text style={styles.noResultsSubtitle}>
            Try searching with different keywords{"\n"}(event name, location, phone number)
          </Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="globe-outline" size={64} color={theme.colors.border} />
          <Text style={styles.noResultsTitle}>Find an Event</Text>
          <Text style={styles.noResultsSubtitle}>
            Search for an event by name, location,{"\n"}phone number, or couple names
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backBtn: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    height: 48,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  eventCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'column',
  },
  couplePhoto: {
    width: '100%',
    height: 140,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  eventName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  typeBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  coupleNames: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  sendGiftBtn: {
    backgroundColor: theme.colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  sendGiftBtnText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  searchingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  noResultsTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  noResultsSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
});
