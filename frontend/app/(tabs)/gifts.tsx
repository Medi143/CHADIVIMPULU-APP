import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { Picker } from '@react-native-picker/picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Gifts() {
  const { user, activeEvent } = useAuth();
  const router = useRouter();
  const eventId = activeEvent?._id || user?.current_event_id;
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSide, setFilterSide] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    mobile: '',
    side: 'bride',
    gift_type: 'cash',
    amount: '',
    item_description: '',
    payment_mode: 'cash',
    notes: '',
  });

  // Refresh data every time this tab is focused
  const navigation = useNavigation();
  useEffect(() => {
    if (eventId) {
      loadGifts();
    }
  }, [eventId, searchQuery, filterSide]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (eventId) {
        loadGifts();
      }
    });
    return unsubscribe;
  }, [navigation, eventId, searchQuery, filterSide]);

  const loadGifts = async () => {
    try {
      let url = `${BACKEND_URL}/api/gifts/${eventId}`;
      const params = [];
      if (filterSide) params.push(`side=${filterSide}`);
      if (searchQuery) params.push(`search=${searchQuery}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setGifts(data.gifts);
      }
    } catch (error) {
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGift = async () => {
    if (!formData.guest_name) {
      Alert.alert('Error', 'Please enter guest name');
      return;
    }

    if (formData.gift_type === 'cash' && !formData.amount) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    if (formData.gift_type === 'item' && !formData.item_description) {
      Alert.alert('Error', 'Please enter item description');
      return;
    }

    try {
      const payload = {
        ...formData,
        event_id: eventId,
        added_by: user?.name || user?.phone,
        amount: formData.gift_type === 'cash' ? parseFloat(formData.amount) : null,
      };

      const response = await fetch(`${BACKEND_URL}/api/gifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Gift entry added successfully');
        setShowAddModal(false);
        setFormData({
          guest_name: '',
          mobile: '',
          side: 'bride',
          gift_type: 'cash',
          amount: '',
          item_description: '',
          payment_mode: 'cash',
          notes: '',
        });
        loadGifts();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add gift entry');
    }
  };

  const renderGiftItem = ({ item }: any) => (
    <View style={styles.giftCard}>
      <View style={styles.giftHeader}>
        <View>
          <Text style={styles.guestName}>{item.guest_name}</Text>
          {item.mobile && <Text style={styles.mobile}>{item.mobile}</Text>}
        </View>
        <View style={styles.sideBadge}>
          <Text style={styles.sideText}>{item.side}</Text>
        </View>
      </View>

      <View style={styles.giftDetails}>
        <View style={styles.detailRow}>
          <Ionicons
            name={item.gift_type === 'cash' ? 'cash-outline' : 'gift-outline'}
            size={20}
            color={theme.colors.secondary}
          />
          <Text style={styles.detailText}>
            {item.gift_type === 'cash'
              ? `₹${item.amount?.toLocaleString()}`
              : item.item_description}
          </Text>
        </View>

        {item.payment_mode && (
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.paymentMode}>{item.payment_mode.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {item.notes && <Text style={styles.notes}>{item.notes}</Text>}

      <Text style={styles.timestamp}>
        Added by {item.added_by} • {new Date(item.timestamp).toLocaleDateString()}
      </Text>
    </View>
  );

  if (!eventId) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={80} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>Please create an event first</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or mobile"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={gifts}
          renderItem={renderGiftItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyText}>No gift entries yet</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          if (eventId) {
            router.push({ pathname: '/gift-entry', params: { eventId: eventId } });
          } else {
            setShowAddModal(true);
          }
        }}
      >
        <Ionicons name="add" size={32} color={theme.colors.white} />
      </TouchableOpacity>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Gift Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Guest Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter guest name"
                value={formData.guest_name}
                onChangeText={(text) => setFormData({ ...formData, guest_name: text })}
                placeholderTextColor={theme.colors.textSecondary}
              />

              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                value={formData.mobile}
                onChangeText={(text) => setFormData({ ...formData, mobile: text })}
                placeholderTextColor={theme.colors.textSecondary}
              />

              <Text style={styles.label}>Side *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.side}
                  onValueChange={(value) => setFormData({ ...formData, side: value })}
                >
                  <Picker.Item label="Bride" value="bride" />
                  <Picker.Item label="Groom" value="groom" />
                </Picker>
              </View>

              <Text style={styles.label}>Gift Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.gift_type}
                  onValueChange={(value) => setFormData({ ...formData, gift_type: value })}
                >
                  <Picker.Item label="Cash" value="cash" />
                  <Picker.Item label="Item" value="item" />
                </Picker>
              </View>

              {formData.gift_type === 'cash' ? (
                <>
                  <Text style={styles.label}>Amount *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    value={formData.amount}
                    onChangeText={(text) => setFormData({ ...formData, amount: text })}
                    placeholderTextColor={theme.colors.textSecondary}
                  />

                  <Text style={styles.label}>Payment Mode</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.payment_mode}
                      onValueChange={(value) => setFormData({ ...formData, payment_mode: value })}
                    >
                      <Picker.Item label="Cash" value="cash" />
                      <Picker.Item label="UPI" value="upi" />
                    </Picker>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Item Description *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the gift item"
                    multiline
                    numberOfLines={3}
                    value={formData.item_description}
                    onChangeText={(text) => setFormData({ ...formData, item_description: text })}
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </>
              )}

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Additional notes"
                multiline
                numberOfLines={2}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholderTextColor={theme.colors.textSecondary}
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAddGift}>
                <Text style={styles.submitButtonText}>Add Gift Entry</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    margin: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    height: 45,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  filterText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  giftCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  giftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  guestName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  mobile: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  sideBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  sideText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  giftDetails: {
    marginTop: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.secondary,
    marginLeft: theme.spacing.sm,
  },
  paymentMode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  notes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  form: {
    padding: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
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
    marginBottom: theme.spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  submitButton: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
});
