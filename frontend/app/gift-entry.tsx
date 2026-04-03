import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const PREDEFINED_AMOUNTS = [216, 516, 1016, 2016, 5016];

export default function GiftEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, activeEvent } = useAuth();
  const params = useLocalSearchParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const amountInputRef = useRef<TextInput>(null);

  // Form state
  const [guestName, setGuestName] = useState('');
  const [area, setArea] = useState('');
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState<'bride' | 'groom'>('bride');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | null>(null);

  useEffect(() => {
    const eventId = params.eventId || activeEvent?._id || user?.current_event_id;
    if (eventId) {
      loadEvent(eventId);
      loadGuestCount(eventId);
    }
  }, [params.eventId, activeEvent?._id, user?.current_event_id]);

  const loadEvent = async (eventId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  const loadGuestCount = async (eventId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/gifts/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setGuestCount(data.gifts.length);
      }
    } catch (error) {
      console.error('Error loading guest count:', error);
    }
  };

  const handleAmountSelect = (value: number) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  const handleAmountChange = (text: string) => {
    setAmount(text);
    const numVal = parseInt(text);
    if (PREDEFINED_AMOUNTS.includes(numVal)) {
      setSelectedAmount(numVal);
    } else {
      setSelectedAmount(null);
    }
  };

  const handleSubmit = async (mode: 'cash' | 'upi') => {
    if (!guestName.trim()) {
      Alert.alert('Required', 'Please enter guest name');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Required', 'Please enter or select an amount');
      return;
    }

    setPaymentMode(mode);
    setLoading(true);
    Keyboard.dismiss();

    try {
      const eventId = params.eventId || activeEvent?._id || user?.current_event_id;
      const payload = {
        event_id: eventId,
        guest_name: guestName.trim(),
        area: area.trim(),
        side: side,
        gift_type: 'cash',
        amount: parseFloat(amount),
        payment_mode: mode,
        added_by: user?.name || user?.phone || 'Staff',
      };

      const response = await fetch(`${BACKEND_URL}/api/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        const sNo = data.gift?.s_no || guestCount + 1;
        Alert.alert(
          'Gift Recorded!',
          `S.No #${sNo}\n${guestName} - ₹${parseFloat(amount).toLocaleString()}\nPayment: ${mode.toUpperCase()}`,
          [
            {
              text: 'Add Another',
              onPress: () => {
                resetForm();
                setGuestCount((prev) => prev + 1);
              },
            },
            {
              text: 'Done',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(data.detail || 'Failed to save gift');
      }
    } catch (error: any) {
      console.error('Error saving gift:', error);
      Alert.alert('Error', error.message || 'Failed to save gift entry');
    } finally {
      setLoading(false);
      setPaymentMode(null);
    }
  };

  const resetForm = () => {
    setGuestName('');
    setArea('');
    setAmount('');
    setSelectedAmount(null);
    setPaymentMode(null);
    setSide('bride');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Gift Entry</Text>
          <Text style={styles.headerSubtitle}>Enter guest gift details</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card */}
        <View style={styles.card}>
          {/* Guest Name */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="person" size={18} color={theme.colors.secondary} />
              <Text style={styles.label}>Guest Name*</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={guestName}
              onChangeText={setGuestName}
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          {/* Area */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="location" size={18} color={theme.colors.secondary} />
              <Text style={styles.label}>Area</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your area"
              value={area}
              onChangeText={setArea}
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          {/* Amount Section */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <Text style={[styles.label, { color: '#D84315' }]}>ChadivimpuluTM</Text>
            </View>
            <TextInput
              ref={amountInputRef}
              style={[styles.input, styles.amountInput]}
              placeholder="Enter amount"
              value={amount}
              onChangeText={handleAmountChange}
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            {/* Predefined Amount Buttons - Horizontal Scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.amountScrollRow}
              contentContainerStyle={styles.amountScrollContent}
            >
              {PREDEFINED_AMOUNTS.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.amountButton,
                    selectedAmount === val && styles.amountButtonSelected,
                  ]}
                  onPress={() => handleAmountSelect(val)}
                >
                  <Text
                    style={[
                      styles.amountButtonText,
                      selectedAmount === val && styles.amountButtonTextSelected,
                    ]}
                  >
                    {'\u20b9'}{val.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Side Selector */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="people" size={18} color={theme.colors.secondary} />
              <Text style={styles.label}>Side</Text>
            </View>
            <View style={styles.sideRow}>
              <TouchableOpacity
                style={[styles.sideButton, side === 'bride' && styles.sideButtonActive]}
                onPress={() => setSide('bride')}
              >
                <Ionicons
                  name="woman"
                  size={18}
                  color={side === 'bride' ? theme.colors.white : '#E91E63'}
                />
                <Text style={[styles.sideButtonText, side === 'bride' && styles.sideButtonTextActive]}>
                  Bride
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sideButton, side === 'groom' && styles.sideButtonActiveGroom]}
                onPress={() => setSide('groom')}
              >
                <Ionicons
                  name="man"
                  size={18}
                  color={side === 'groom' ? theme.colors.white : '#1565C0'}
                />
                <Text style={[styles.sideButtonText, side === 'groom' && styles.sideButtonTextActive]}>
                  Groom
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Event Info Section */}
          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Family Head:</Text>
              <Text style={styles.infoValue}>
                {event?.family_head_name || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>UPI Phone:</Text>
              <Text style={styles.infoValue}>
                {event?.phone_number || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Guest Limit:</Text>
              <Text style={styles.infoValue}>
                {guestCount} / {event?.guest_limit || 500}
              </Text>
            </View>
          </View>

          {/* QR Code Section */}
          {event?.qr_code && (
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>QR Code</Text>
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: event.qr_code }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.qrHint}>Scan with any UPI app to pay</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.payButton, styles.cashButton]}
            onPress={() => handleSubmit('cash')}
            disabled={loading}
          >
            {loading && paymentMode === 'cash' ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="cash" size={22} color={theme.colors.white} />
                <Text style={styles.payButtonText}>Pay by Cash</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payButton, styles.upiButton]}
            onPress={() => handleSubmit('upi')}
            disabled={loading}
          >
            {loading && paymentMode === 'upi' ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="phone-portrait" size={22} color={theme.colors.white} />
                <Text style={styles.payButtonText}>Pay via UPI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: '#FFE082',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  rupeeSymbol: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: '#D84315',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  amountInput: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: '#D84315',
  },
  amountScrollRow: {
    marginTop: theme.spacing.md,
  },
  amountScrollContent: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: theme.spacing.md,
  },
  amountButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FF8A65',
    backgroundColor: '#FFF3E0',
  },
  amountButtonSelected: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  amountButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: '#D84315',
  },
  amountButtonTextSelected: {
    color: theme.colors.white,
  },
  sideRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  sideButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    gap: theme.spacing.sm,
  },
  sideButtonActive: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  sideButtonActiveGroom: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  sideButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sideButtonTextActive: {
    color: theme.colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: theme.spacing.md,
  },
  infoSection: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  qrSection: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  qrTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  qrContainer: {
    width: 180,
    height: 180,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  qrHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  actionButtons: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cashButton: {
    backgroundColor: '#FF8C00',
  },
  upiButton: {
    backgroundColor: '#4CAF50',
  },
  payButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});
