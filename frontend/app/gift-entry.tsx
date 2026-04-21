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
  Modal,
  Animated,
  Vibration,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const PREDEFINED_AMOUNTS = [516, 1016, 2016, 5016, 10016];

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
  const [giftType, setGiftType] = useState<'cash' | 'item'>('cash');
  const [itemDescription, setItemDescription] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | null>(null);

  // Voice input state
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'success'>('idle');
  const [recognizedText, setRecognizedText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [parsedVoice, setParsedVoice] = useState<{name: string; area: string; amount: string; type: 'cash' | 'item'; itemDesc: string}>({
    name: '', area: '', amount: '', type: 'cash', itemDesc: '',
  });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Voice recognition events
  useSpeechRecognitionEvent('start', () => {
    setVoiceState('listening');
    startPulseAnimation();
  });

  useSpeechRecognitionEvent('end', () => {
    if (voiceState === 'listening') {
      setVoiceState('processing');
    }
    stopPulseAnimation();
  });

  useSpeechRecognitionEvent('result', (event: any) => {
    const text = event.results?.[0]?.transcript || '';
    setRecognizedText(text);
    if (event.isFinal || text.length > 0) {
      const parsed = parseVoiceInput(text);
      setParsedVoice(parsed);
      setVoiceState('success');
      setShowConfirmModal(true);
      Vibration.vibrate(50);
    }
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    console.warn('Voice error:', event);
    setVoiceState('idle');
    stopPulseAnimation();
    Alert.alert('Voice Error', "Couldn't understand. Please try again.");
  });

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const parseVoiceInput = (text: string): {name: string; area: string; amount: string; type: 'cash' | 'item'; itemDesc: string} => {
    const words = text.trim().split(/\s+/);
    let name = '';
    let area = '';
    let amount = '';
    let type: 'cash' | 'item' = 'cash';
    let itemDesc = '';

    // Common Indian city/area names for matching
    const knownAreas = [
      'hyderabad', 'bangalore', 'chennai', 'mumbai', 'delhi', 'pune', 'kolkata',
      'warangal', 'karimnagar', 'nizamabad', 'khammam', 'nalgonda', 'guntur',
      'vijayawada', 'visakhapatnam', 'vizag', 'tirupati', 'rajahmundry',
      'kakinada', 'eluru', 'ongole', 'kurnool', 'anantapur', 'nellore',
      'siddipet', 'mancherial', 'adilabad', 'mahabubnagar', 'sangareddy',
      'medak', 'suryapet', 'miryalaguda', 'jangaon', 'kamareddy',
      'secunderabad', 'kukatpally', 'uppal', 'dilsukhnagar', 'ameerpet',
      'begumpet', 'madhapur', 'gachibowli', 'kondapur', 'miyapur',
    ];

    const itemKeywords = ['item', 'gift', 'silver', 'gold', 'chain', 'ring', 'set', 'dinner', 'glass', 'plate', 'saree', 'sari', 'vessel', 'blanket'];

    const nameWords: string[] = [];
    const areaWords: string[] = [];
    let foundAmount = false;
    let isItem = false;
    let itemWords: string[] = [];

    for (const word of words) {
      const lower = word.toLowerCase().replace(/[,₹]/g, '');

      // Skip filler words
      if (['from', 'of', 'and', 'the', 'rupees', 'rs', 'cash', 'upi'].includes(lower)) continue;

      // Check if it's a number (amount)
      const num = parseInt(lower.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num > 0 && lower.match(/\d/)) {
        amount = num.toString();
        foundAmount = true;
        continue;
      }

      // Check for item keywords
      if (itemKeywords.includes(lower)) {
        isItem = true;
        itemWords.push(word);
        continue;
      }

      // Check if it's a known area
      if (knownAreas.includes(lower)) {
        areaWords.push(word);
        continue;
      }

      // Otherwise treat as part of name (if no amount found yet) or area
      if (!foundAmount && areaWords.length === 0) {
        nameWords.push(word);
      } else {
        areaWords.push(word);
      }
    }

    name = nameWords.join(' ');
    area = areaWords.join(' ');
    type = isItem ? 'item' : 'cash';
    itemDesc = itemWords.join(' ');

    return { name, area, amount, type, itemDesc };
  };

  const handleVoiceStart = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed for voice entry. Please enable it in settings.');
        return;
      }

      setRecognizedText('');
      setVoiceState('listening');

      ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        maxAlternatives: 1,
      });
    } catch (err) {
      console.error('Voice start error:', err);
      setVoiceState('idle');
      Alert.alert('Error', 'Failed to start voice recognition. Please try again.');
    }
  };

  const handleVoiceStop = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      console.warn('Stop error:', e);
    }
    setVoiceState('idle');
    stopPulseAnimation();
  };

  const confirmVoiceInput = () => {
    setGuestName(parsedVoice.name);
    setArea(parsedVoice.area);
    if (parsedVoice.amount) {
      setAmount(parsedVoice.amount);
      const numVal = parseInt(parsedVoice.amount);
      if (PREDEFINED_AMOUNTS.includes(numVal)) {
        setSelectedAmount(numVal);
      }
    }
    if (parsedVoice.type === 'item') {
      setGiftType('item');
      setItemDescription(parsedVoice.itemDesc);
    } else {
      setGiftType('cash');
    }
    setShowConfirmModal(false);
    setVoiceState('idle');
  };

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

  const getEventDisplayName = () => {
    if (!event) return '';
    const name = event.name || event.event_name || '';
    const type = event.event_type || '';
    if (name.toLowerCase().includes(type.toLowerCase())) return name;
    return name ? `${name} ${type}` : type;
  };

  const handleSubmit = async (mode: 'cash' | 'upi') => {
    if (!guestName.trim()) {
      Alert.alert('Required', 'Please enter guest name');
      return;
    }

    if (giftType === 'cash') {
      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Required', 'Please enter or select an amount');
        return;
      }
    } else {
      if (!itemDescription.trim()) {
        Alert.alert('Required', 'Please enter item description');
        return;
      }
    }

    setPaymentMode(mode);
    setLoading(true);
    Keyboard.dismiss();

    try {
      const eventId = params.eventId || activeEvent?._id || user?.current_event_id;
      const payload: any = {
        event_id: eventId,
        guest_name: guestName.trim(),
        area: area.trim(),
        side: 'general',
        gift_type: giftType,
        payment_mode: giftType === 'cash' ? mode : 'item',
        added_by: user?.name || user?.phone || 'Staff',
      };

      if (giftType === 'cash') {
        payload.amount = parseFloat(amount);
      } else {
        payload.item_description = itemDescription.trim();
        payload.amount = 0;
      }

      const response = await fetch(`${BACKEND_URL}/api/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        const sNo = data.gift?.s_no || guestCount + 1;
        const msg = giftType === 'cash'
          ? `S.No #${sNo}\n${guestName} - ₹${parseFloat(amount).toLocaleString()}\nPayment: ${mode.toUpperCase()}`
          : `S.No #${sNo}\n${guestName} - ${itemDescription}\nType: Gift Item`;

        Alert.alert('Gift Recorded!', msg, [
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
        ]);
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
    setItemDescription('');
    setSelectedAmount(null);
    setPaymentMode(null);
    setGiftType('cash');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header - extends behind status bar */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Gift Entry</Text>
          {event && (
            <Text style={styles.headerEventName} numberOfLines={1}>
              {getEventDisplayName()}
            </Text>
          )}
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
            <View style={styles.inputWithMic}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Enter guest full name"
                value={guestName}
                onChangeText={setGuestName}
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[
                  styles.micButton,
                  voiceState === 'listening' && styles.micButtonListening,
                ]}
                onPress={voiceState === 'listening' ? handleVoiceStop : handleVoiceStart}
                activeOpacity={0.7}
              >
                {voiceState === 'listening' ? (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="stop-circle" size={24} color="#fff" />
                  </Animated.View>
                ) : voiceState === 'processing' ? (
                  <ActivityIndicator size="small" color={theme.colors.secondary} />
                ) : (
                  <Ionicons name="mic" size={24} color={voiceState === 'success' ? '#4CAF50' : theme.colors.secondary} />
                )}
              </TouchableOpacity>
            </View>
            {voiceState === 'listening' && (
              <View style={styles.listeningBanner}>
                <View style={styles.listeningDot} />
                <Text style={styles.listeningText}>Listening... Speak now</Text>
              </View>
            )}
            {voiceState === 'processing' && (
              <View style={styles.processingBanner}>
                <ActivityIndicator size="small" color="#FF8C00" />
                <Text style={styles.processingText}>Processing voice...</Text>
              </View>
            )}
          </View>

          {/* Area */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="location" size={18} color={theme.colors.secondary} />
              <Text style={styles.label}>Area</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter area / city"
              value={area}
              onChangeText={setArea}
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          {/* Chadivimpulu Toggle: Cash / Item */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="gift" size={18} color={theme.colors.secondary} />
              <Text style={styles.label}>Chadivimpulu™</Text>
            </View>
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[styles.typeCard, giftType === 'cash' && styles.typeCardActiveCash]}
                onPress={() => setGiftType('cash')}
              >
                <Ionicons name="cash" size={24} color={giftType === 'cash' ? theme.colors.white : '#FF8C00'} />
                <Text style={[styles.typeCardText, giftType === 'cash' && styles.typeCardTextActive]}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeCard, giftType === 'item' && styles.typeCardActiveItem]}
                onPress={() => setGiftType('item')}
              >
                <Ionicons name="cube" size={24} color={giftType === 'item' ? theme.colors.white : '#7B1FA2'} />
                <Text style={[styles.typeCardText, giftType === 'item' && styles.typeCardTextActive]}>Item</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cash Amount Section */}
          {giftType === 'cash' && (
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <Text style={[styles.label, { color: '#D84315' }]}>Amount *</Text>
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

              {/* Predefined Amount Buttons */}
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
          )}

          {/* Item Description Section */}
          {giftType === 'item' && (
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Ionicons name="create" size={18} color="#7B1FA2" />
                <Text style={[styles.label, { color: '#7B1FA2' }]}>Item Description *</Text>
              </View>
              <TextInput
                style={[styles.input, styles.itemInput]}
                placeholder="Enter gift item (e.g., Gold Chain, Dinner Set)"
                value={itemDescription}
                onChangeText={setItemDescription}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}

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
              <Text style={styles.infoLabel}>Guest Count:</Text>
              <Text style={styles.infoValue}>
                {guestCount} / {event?.guest_limit || 500}
              </Text>
            </View>
          </View>

          {/* QR Code Section - Only for Cash */}
          {giftType === 'cash' && event?.qr_code && (
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
        {giftType === 'cash' ? (
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
                  <Text style={styles.payButtonText}>Save - Cash</Text>
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
                  <Text style={styles.payButtonText}>Save - UPI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.payButton, styles.itemSaveButton]}
              onPress={() => handleSubmit('cash')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="cube" size={22} color={theme.colors.white} />
                  <Text style={styles.payButtonText}>Save Gift Item</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Voice Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowConfirmModal(false); setVoiceState('idle'); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmHeader}>
              <Ionicons name="mic" size={28} color={theme.colors.secondary} />
              <Text style={styles.confirmTitle}>Voice Entry</Text>
            </View>

            {recognizedText ? (
              <View style={styles.recognizedBox}>
                <Text style={styles.recognizedLabel}>You said:</Text>
                <Text style={styles.recognizedText}>"{recognizedText}"</Text>
              </View>
            ) : null}

            <View style={styles.confirmFields}>
              <View style={styles.confirmFieldRow}>
                <Text style={styles.confirmFieldLabel}>Name:</Text>
                <Text style={styles.confirmFieldValue}>{parsedVoice.name || '—'}</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmFieldRow}>
                <Text style={styles.confirmFieldLabel}>Area:</Text>
                <Text style={styles.confirmFieldValue}>{parsedVoice.area || '—'}</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmFieldRow}>
                <Text style={styles.confirmFieldLabel}>Amount:</Text>
                <Text style={[styles.confirmFieldValue, styles.confirmAmount]}>
                  {parsedVoice.amount ? `\u20b9${parseInt(parsedVoice.amount).toLocaleString()}` : '—'}
                </Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmFieldRow}>
                <Text style={styles.confirmFieldLabel}>Type:</Text>
                <Text style={styles.confirmFieldValue}>
                  {parsedVoice.type === 'item' ? `Item (${parsedVoice.itemDesc})` : 'Cash'}
                </Text>
              </View>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmBtnPrimary}
                onPress={confirmVoiceInput}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.confirmBtnPrimaryText}>Confirm & Fill</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtnSecondary}
                onPress={() => { setShowConfirmModal(false); handleVoiceStart(); }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color={theme.colors.secondary} />
                <Text style={styles.confirmBtnSecondaryText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtnCancel}
                onPress={() => { setShowConfirmModal(false); setVoiceState('idle'); }}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerEventName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
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
  itemInput: {
    minHeight: 80,
    paddingTop: 14,
  },
  // Type toggle
  typeToggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  typeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    gap: theme.spacing.sm,
  },
  typeCardActiveCash: {
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
  },
  typeCardActiveItem: {
    backgroundColor: '#7B1FA2',
    borderColor: '#7B1FA2',
  },
  typeCardText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
  },
  typeCardTextActive: {
    color: theme.colors.white,
  },
  // Amounts
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
  itemSaveButton: {
    backgroundColor: '#7B1FA2',
  },
  payButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  // Voice input styles
  inputWithMic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  micButtonListening: {
    backgroundColor: '#EF5350',
    borderColor: '#EF5350',
  },
  listeningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    gap: 8,
  },
  listeningDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF5350',
  },
  listeningText: {
    fontSize: theme.fontSize.sm,
    color: '#C62828',
    fontWeight: '600',
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    gap: 8,
  },
  processingText: {
    fontSize: theme.fontSize.sm,
    color: '#E65100',
    fontWeight: '600',
  },
  // Confirmation Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
  },
  recognizedBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  recognizedLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  recognizedText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontStyle: 'italic',
  },
  confirmFields: {
    backgroundColor: '#FAFAFA',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    marginBottom: 20,
  },
  confirmFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  confirmFieldLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  confirmFieldValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  confirmAmount: {
    color: '#D84315',
    fontSize: theme.fontSize.lg,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  confirmActions: {
    gap: 10,
  },
  confirmBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  confirmBtnPrimaryText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
  confirmBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    gap: 8,
  },
  confirmBtnSecondaryText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  confirmBtnCancel: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  confirmBtnCancelText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});
