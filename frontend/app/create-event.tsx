import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const EVENT_TYPES = [
  { label: 'Select event type', value: '' },
  { label: 'Wedding', value: 'wedding' },
  { label: 'Housewarming', value: 'housewarming' },
  { label: 'Engagement', value: 'engagement' },
  { label: 'Baby Shower', value: 'babyshower' },
  { label: 'Naming Ceremony', value: 'naming' },
  { label: 'Birthday', value: 'birthday' },
  { label: 'Sashtipoorthi', value: 'sashtipoorthi' },
  { label: 'Half Saree', value: 'halfsaree' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default function CreateEvent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, login, setActiveEvent } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [eventType, setEventType] = useState('');
  const [familyHeadName, setFamilyHeadName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [eventPersonName, setEventPersonName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [couplePhoto, setCouplePhoto] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);

  const getDaysArray = () => {
    const maxDays = DAYS_IN_MONTH[selectedMonth] || 31;
    return Array.from({ length: maxDays }, (_, i) => i + 1);
  };

  const handleDateConfirm = () => {
    const day = String(selectedDay).padStart(2, '0');
    const month = String(selectedMonth + 1).padStart(2, '0');
    const dateStr = `${day}/${month}/${selectedYear}`;
    setEventDate(dateStr);
    setShowDatePicker(false);
  };

  const pickImage = async (type: 'couple' | 'qr') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'qr' ? [1, 1] : [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (type === 'couple') {
          setCouplePhoto(base64Image);
        } else {
          setQrCode(base64Image);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = () => {
    if (!eventType) {
      Alert.alert('Required Field', 'Please select event type');
      return false;
    }
    if (!familyHeadName.trim()) {
      Alert.alert('Required Field', 'Please enter family head/organizer name');
      return false;
    }
    if (eventType === 'wedding') {
      if (!brideName.trim() || !groomName.trim()) {
        Alert.alert('Required Field', 'Please enter bride and groom names');
        return false;
      }
    } else {
      if (!eventPersonName.trim()) {
        Alert.alert('Required Field', 'Please enter event person name');
        return false;
      }
    }
    if (!eventDate.trim()) {
      Alert.alert('Required Field', 'Please select event date');
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Required Field', 'Please enter phone number');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter email address');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Required Field', 'Please enter address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const eventName = eventType === 'wedding' 
        ? `${brideName} & ${groomName} Wedding`
        : `${eventPersonName}'s ${EVENT_TYPES.find(t => t.value === eventType)?.label}`;

      const eventData = {
        name: eventName,
        date: eventDate,
        location: address,
        event_type: eventType,
        family_head_name: familyHeadName,
        bride_name: eventType === 'wedding' ? brideName : null,
        groom_name: eventType === 'wedding' ? groomName : null,
        event_person_name: eventType !== 'wedding' ? eventPersonName : null,
        phone_number: phoneNumber,
        email: email,
        address: address,
        couple_photo: couplePhoto,
        qr_code: qrCode,
        user_id: user?._id,
      };

      const response = await fetch(`${BACKEND_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (data.success) {
        // Set active event
        await setActiveEvent(data.event);
        
        // Update user's current event
        if (user) {
          const updatedUser = { ...user, current_event_id: data.event._id };
          await login(updatedUser);
        }

        // Navigate to Welcome page
        router.replace({ 
          pathname: '/welcome', 
          params: { eventId: data.event._id } 
        });
      } else {
        throw new Error(data.message || 'Failed to create event');
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Error', error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="heart" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Create Your Event</Text>
          <Text style={styles.subtitle}>Set up your special occasion for digital gifts</Text>
        </View>

        {/* Event Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Event Details</Text>
          <Text style={styles.cardSubtitle}>
            Fill in your event information to create your personalized gift page
          </Text>

          {/* Event Type Dropdown */}
          <Text style={styles.label}>Event Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={eventType}
              onValueChange={setEventType}
              style={styles.picker}
            >
              {EVENT_TYPES.map((type) => (
                <Picker.Item key={type.value} label={type.label} value={type.value} />
              ))}
            </Picker>
          </View>

          {eventType ? (
            <>
              {/* Contact Information */}
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>Contact Information</Text>

              <Text style={styles.label}>Family Head/Organizer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter organizer's name"
                value={familyHeadName}
                onChangeText={setFamilyHeadName}
                placeholderTextColor={theme.colors.textSecondary}
              />

              {/* Wedding-specific fields */}
              {eventType === 'wedding' && (
                <>
                  <Text style={styles.label}>Bride Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter bride's name"
                    value={brideName}
                    onChangeText={setBrideName}
                    placeholderTextColor={theme.colors.textSecondary}
                  />

                  <Text style={styles.label}>Groom Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter groom's name"
                    value={groomName}
                    onChangeText={setGroomName}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </>
              )}

              {/* Other events fields */}
              {eventType !== 'wedding' && (
                <>
                  <Text style={styles.label}>Event Person Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter person's name"
                    value={eventPersonName}
                    onChangeText={setEventPersonName}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </>
              )}

              {/* Event Date with Calendar Picker */}
              <Text style={styles.label}>Event Date *</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={22} color={theme.colors.secondary} />
                <Text style={[
                  styles.dateText,
                  !eventDate && { color: theme.colors.textSecondary }
                ]}>
                  {eventDate || 'Tap to select date'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholderTextColor={theme.colors.textSecondary}
              />

              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={theme.colors.textSecondary}
              />

              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter complete address"
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={setAddress}
                placeholderTextColor={theme.colors.textSecondary}
              />

              {/* Image Uploads */}
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>Media Uploads</Text>

              <Text style={styles.label}>
                {eventType === 'wedding' ? 'Upload Couple Photo' : 'Upload Photo'}
              </Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage('couple')}
              >
                {couplePhoto ? (
                  <Image source={{ uri: couplePhoto }} style={styles.previewImage} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={40} color={theme.colors.primary} />
                    <Text style={styles.uploadText}>Tap to upload photo</Text>
                    <Text style={styles.uploadHint}>JPG, PNG, WEBP - max 5MB</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Upload Your QR Code *</Text>
              <Text style={styles.hint}>
                Upload your UPI QR code (Paytm / PhonePe / Google Pay supported). JPG, PNG, WEBP - max 3MB.
              </Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage('qr')}
              >
                {qrCode ? (
                  <Image source={{ uri: qrCode }} style={styles.previewImage} />
                ) : (
                  <>
                    <Ionicons name="qr-code-outline" size={40} color={theme.colors.secondary} />
                    <Text style={styles.uploadText}>Tap to upload QR code</Text>
                    <Text style={styles.uploadHint}>JPG, PNG, WEBP - max 3MB</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Submit Button */}
        {eventType ? (
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Details</Text>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.white} />
              </>
            )}
          </TouchableOpacity>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalContent}>
            <View style={styles.dateModalHeader}>
              <Text style={styles.dateModalTitle}>Select Event Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Date Display */}
            <View style={styles.dateDisplayRow}>
              <Text style={styles.dateDisplay}>
                {selectedDay} {MONTHS[selectedMonth]} {selectedYear}
              </Text>
            </View>

            {/* Pickers */}
            <View style={styles.datePickerRow}>
              {/* Day Picker */}
              <View style={styles.datePickerCol}>
                <Text style={styles.datePickerLabel}>Day</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {getDaysArray().map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.datePickerItem,
                        selectedDay === day && styles.datePickerItemSelected,
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text
                        style={[
                          styles.datePickerItemText,
                          selectedDay === day && styles.datePickerItemTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={[styles.datePickerCol, { flex: 2 }]}>
                <Text style={styles.datePickerLabel}>Month</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((month, idx) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.datePickerItem,
                        selectedMonth === idx && styles.datePickerItemSelected,
                      ]}
                      onPress={() => setSelectedMonth(idx)}
                    >
                      <Text
                        style={[
                          styles.datePickerItemText,
                          selectedMonth === idx && styles.datePickerItemTextSelected,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.datePickerCol}>
                <Text style={styles.datePickerLabel}>Year</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.datePickerItem,
                        selectedYear === year && styles.datePickerItemSelected,
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text
                        style={[
                          styles.datePickerItemText,
                          selectedYear === year && styles.datePickerItemTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity style={styles.dateConfirmButton} onPress={handleDateConfirm}>
              <Text style={styles.dateConfirmText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  hint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dateText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  pickerContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  picker: {
    height: 50,
  },
  uploadButton: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    minHeight: 150,
  },
  uploadText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  uploadHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    resizeMode: 'cover',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  // Date Modal Styles
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dateModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '70%',
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dateModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  dateDisplayRow: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: '#FFF9E6',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  dateDisplay: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    height: 200,
  },
  datePickerCol: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  datePickerScroll: {
    flex: 1,
  },
  datePickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    marginBottom: 2,
  },
  datePickerItemSelected: {
    backgroundColor: theme.colors.secondary,
  },
  datePickerItemText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  datePickerItemTextSelected: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  dateConfirmButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  dateConfirmText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
});
