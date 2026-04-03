import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    if (params.eventId) {
      loadEvent();
    }
  }, [params.eventId]);

  const loadEvent = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${params.eventId}`);
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  const getEventTitle = () => {
    if (!event) return '';
    if (event.event_type === 'wedding') {
      return `${event.bride_name || ''} & ${event.groom_name || ''}`;
    }
    return event.event_person_name || event.name || '';
  };

  const getEventTypeLabel = () => {
    if (!event) return 'Event';
    const labels: Record<string, string> = {
      wedding: 'Wedding',
      housewarming: 'Housewarming',
      engagement: 'Engagement',
      babyshower: 'Baby Shower',
      naming: 'Naming Ceremony',
      birthday: 'Birthday',
      sashtipoorthi: 'Sashtipoorthi',
      halfsaree: 'Half Saree',
    };
    return labels[event.event_type] || 'Event';
  };

  const handleStartGiftEntry = () => {
    router.push({ pathname: '/gift-entry', params: { eventId: params.eventId } });
  };

  const handleGoToDashboard = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chadivimpulu<Text style={{fontSize: 16}}>™</Text></Text>
        <TouchableOpacity onPress={handleGoToDashboard} style={styles.settingsButton}>
          <Ionicons name="grid-outline" size={22} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Couple Photo Section */}
        <View style={styles.photoSection}>
          {event?.couple_photo ? (
            <View style={styles.photoFrame}>
              <Image
                source={{ uri: event.couple_photo }}
                style={styles.couplePhoto}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="heart" size={50} color={theme.colors.primary} />
            </View>
          )}
        </View>

        {/* Welcome Text */}
        <Text style={styles.welcomeText}>Welcome to the {getEventTypeLabel()} of</Text>

        {/* Names Banner */}
        <View style={styles.namesBanner}>
          <Text style={styles.namesText}>{getEventTitle()}</Text>
        </View>

        {/* Gift Info Card */}
        <View style={styles.giftCard}>
          {/* Gift icon */}
          <View style={styles.giftIconContainer}>
            <Ionicons name="gift" size={36} color={theme.colors.primary} />
          </View>

          <Text style={styles.giftCardTitle}>Digital Gifts - Chadivimpulu™ & More</Text>
          <Text style={styles.giftCardDescription}>
            Share your blessings digitally! Your love and good wishes mean the world to us!
          </Text>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="person" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.stepText}>Enter your name and gift amount</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="card" size={20} color="#FF9800" />
              </View>
              <Text style={styles.stepText}>
                Pay instantly via UPI (Google Pay, PhonePe, Paytm)
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="heart" size={20} color="#E91E63" />
              </View>
              <Text style={styles.stepText}>Your blessings will be cherished forever</Text>
            </View>
          </View>
        </View>

        {/* Start Gift Entry Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartGiftEntry}>
          <Text style={styles.startButtonText}>Start Gift Entry</Text>
          <Ionicons name="arrow-forward" size={22} color={theme.colors.white} />
        </TouchableOpacity>

        {/* Go to Dashboard link */}
        <TouchableOpacity style={styles.dashboardLink} onPress={handleGoToDashboard}>
          <Ionicons name="home-outline" size={18} color={theme.colors.secondary} />
          <Text style={styles.dashboardLinkText}>Go to Dashboard</Text>
        </TouchableOpacity>

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
    justifyContent: 'space-between',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  settingsButton: {
    padding: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  photoSection: {
    marginBottom: theme.spacing.lg,
  },
  photoFrame: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  couplePhoto: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFF9E6',
    borderWidth: 4,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  namesBanner: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  namesText: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
  giftCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#FFE082',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: theme.spacing.xl,
  },
  giftIconContainer: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  giftCardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  giftCardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  stepsContainer: {
    gap: theme.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    elevation: 4,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    gap: theme.spacing.sm,
  },
  startButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  dashboardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dashboardLinkText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
});
