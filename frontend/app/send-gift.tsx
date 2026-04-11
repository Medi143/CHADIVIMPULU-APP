import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL
  || process.env.EXPO_PUBLIC_BACKEND_URL
  || '';

const QUICK_AMOUNTS = [
  { label: '\u20b9516', value: 516 },
  { label: '\u20b91,016', value: 1016 },
  { label: '\u20b92,016', value: 2016 },
  { label: '\u20b95,016', value: 5016 },
  { label: '\u20b910,016', value: 10016 },
];

export default function SendGiftScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    eventId: string;
    eventName: string;
    eventType: string;
    eventLocation: string;
    eventDate: string;
  }>();

  const [guestName, setGuestName] = useState(user?.name || '');
  const [area, setArea] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSendGift = async () => {
    if (!guestName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Required', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: params.eventId,
          guest_name: guestName.trim(),
          area: area.trim() || null,
          gift_type: 'cash',
          amount: amountNum,
          payment_mode: 'upi',
          added_by: guestName.trim(),
          remote_gift: true,
          side: 'general',
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setSavedAmount(amountNum);
        setSuccess(true);
      } else {
        Alert.alert('Error', data.detail || 'Failed to send gift');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success / Confirmation Screen
  if (success) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.headerTitle}>Gift Sent!</Text>
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
          </View>
          <Text style={styles.successTitle}>
            Your Chadivimpulu has been successfully sent!
          </Text>
          <View style={styles.successDetails}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Event</Text>
              <Text style={styles.successValue} numberOfLines={2}>{params.eventName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Amount</Text>
              <Text style={[styles.successValue, styles.amountHighlight]}>\u20b9{savedAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Guest Name</Text>
              <Text style={styles.successValue}>{guestName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Mode</Text>
              <Text style={styles.successValue}>UPI (Online)</Text>
            </View>
          </View>
          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.successBtnPrimary}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.7}
            >
              <Text style={styles.successBtnPrimaryText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successBtnSecondary}
              onPress={() => {
                setSuccess(false);
                setAmount('');
                setGuestName(user?.name || '');
                setArea('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.successBtnSecondaryText}>Send Another Gift</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Gift</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Info Card */}
          <View style={styles.eventInfoCard}>
            <Ionicons name="calendar" size={24} color={theme.colors.secondary} />
            <View style={styles.eventInfoText}>
              <Text style={styles.eventInfoName} numberOfLines={2}>{params.eventName}</Text>
              <Text style={styles.eventInfoSub}>
                {params.eventLocation}{params.eventDate ? ` \u2022 ${params.eventDate}` : ''}
              </Text>
            </View>
          </View>

          {/* Guest Name */}
          <Text style={styles.label}>Your Name *</Text>
          <TextInput
            style={styles.input}
            value={guestName}
            onChangeText={setGuestName}
            placeholder="Enter your name"
            placeholderTextColor={theme.colors.textSecondary}
          />

          {/* Area */}
          <Text style={styles.label}>Area / City (Optional)</Text>
          <TextInput
            style={styles.input}
            value={area}
            onChangeText={setArea}
            placeholder="Enter your area or city"
            placeholderTextColor={theme.colors.textSecondary}
          />

          {/* Gift Type - Cash Only */}
          <View style={styles.giftTypeTag}>
            <Ionicons name="cash" size={20} color={theme.colors.success} />
            <Text style={styles.giftTypeText}>Cash Gift (UPI)</Text>
          </View>

          {/* Amount */}
          <Text style={styles.label}>{'Amount (\u20b9) *'}</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
          />

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountsRow}>
            {QUICK_AMOUNTS.map((qa) => (
              <TouchableOpacity
                key={qa.value}
                style={[
                  styles.quickAmountBtn,
                  amount === qa.value.toString() && styles.quickAmountBtnActive,
                ]}
                onPress={() => handleQuickAmount(qa.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    amount === qa.value.toString() && styles.quickAmountTextActive,
                  ]}
                >
                  {qa.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Send Gift Button */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!guestName.trim() || !amount) && styles.sendBtnDisabled,
            ]}
            onPress={handleSendGift}
            disabled={loading || !guestName.trim() || !amount}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="gift" size={22} color={theme.colors.white} />
                <Text style={styles.sendBtnText}>Send Chadivimpulu</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  eventInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  eventInfoText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  eventInfoName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  eventInfoSub: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  amountInput: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    letterSpacing: 1,
  },
  giftTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
    gap: 8,
    alignSelf: 'flex-start',
  },
  giftTypeText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.success,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: theme.spacing.md,
  },
  quickAmountBtn: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickAmountBtnActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  quickAmountText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
  },
  quickAmountTextActive: {
    color: theme.colors.white,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    marginTop: theme.spacing.xl,
    gap: 10,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.white,
  },
  // Success Screen
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  successIconCircle: {
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  successDetails: {
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  successLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  successValue: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
  },
  amountHighlight: {
    color: theme.colors.success,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  successBtnPrimary: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  successBtnPrimaryText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.white,
  },
  successBtnSecondary: {
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  successBtnSecondaryText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
});
