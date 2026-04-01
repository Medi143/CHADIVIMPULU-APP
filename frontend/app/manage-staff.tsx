import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ManageStaffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, activeEvent } = useAuth();
  const eventId = activeEvent?._id || user?.current_event_id;

  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<'staff' | 'admin'>('staff');

  useEffect(() => {
    if (eventId) loadStaff();
    else setLoading(false);
  }, [eventId]);

  const loadStaff = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/staff/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setStaffList(data.staff || []);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStaff();
  }, [eventId]);

  const handleAddStaff = async () => {
    if (!staffPhone.trim() || staffPhone.trim().length < 10) {
      Alert.alert('Required', 'Please enter a valid phone number');
      return;
    }
    if (!eventId) {
      Alert.alert('Error', 'Please select an active event first');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: staffPhone.trim(),
          event_id: eventId,
          role: staffRole,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Staff member added successfully');
        setStaffPhone('');
        setStaffRole('staff');
        setShowAddForm(false);
        loadStaff();
      } else {
        throw new Error(data.detail || 'Failed to add staff');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add staff');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStaff = (staffId: string, staffName: string) => {
    Alert.alert(
      'Remove Staff',
      `Remove ${staffName} from this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/staff/${staffId}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Removed', 'Staff member removed');
                loadStaff();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove staff');
            }
          },
        },
      ]
    );
  };

  if (!eventId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Staff</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>Please select an active event first</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Staff</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addHeaderBtn}
        >
          <Ionicons name={showAddForm ? 'close' : 'add'} size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Event Info */}
      <View style={styles.eventInfo}>
        <Ionicons name="calendar" size={18} color={theme.colors.secondary} />
        <Text style={styles.eventName}>{activeEvent?.name || 'Active Event'}</Text>
      </View>

      {/* Add Staff Form */}
      {showAddForm && (
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>Add New Staff</Text>
          <TextInput
            style={styles.input}
            placeholder="Staff phone number"
            value={staffPhone}
            onChangeText={setStaffPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />

          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleButton, staffRole === 'staff' && styles.roleButtonActive]}
              onPress={() => setStaffRole('staff')}
            >
              <Ionicons name="person" size={18} color={staffRole === 'staff' ? theme.colors.white : theme.colors.text} />
              <Text style={[styles.roleText, staffRole === 'staff' && styles.roleTextActive]}>Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, staffRole === 'admin' && styles.roleButtonActiveAdmin]}
              onPress={() => setStaffRole('admin')}
            >
              <Ionicons name="shield" size={18} color={staffRole === 'admin' ? theme.colors.white : theme.colors.text} />
              <Text style={[styles.roleText, staffRole === 'admin' && styles.roleTextActive]}>Admin</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddStaff}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color={theme.colors.white} />
                <Text style={styles.addButtonText}>Add Staff</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Staff List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.listTitle}>
          Staff Members ({staffList.length})
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : staffList.length > 0 ? (
          staffList.map((staff, index) => (
            <View key={staff._id || index} style={styles.staffCard}>
              <View style={styles.staffAvatar}>
                <Ionicons name="person" size={24} color={theme.colors.white} />
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{staff.user?.name || `Staff ${index + 1}`}</Text>
                <Text style={styles.staffPhone}>{staff.user?.phone || 'N/A'}</Text>
              </View>
              <View style={[styles.staffRoleBadge, staff.role === 'admin' && styles.adminBadge]}>
                <Text style={styles.staffRoleText}>{staff.role?.toUpperCase()}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveStaff(staff._id, staff.user?.name || 'Staff')}
              >
                <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyList}>
            <Ionicons name="people-outline" size={50} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No staff members yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add staff to this event</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
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
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
  addHeaderBtn: {
    padding: theme.spacing.sm,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  eventName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  addForm: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  formTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  roleButton: {
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
  roleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  roleButtonActiveAdmin: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  roleText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  roleTextActive: {
    color: theme.colors.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.white,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  listTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: theme.spacing.md,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  staffPhone: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  staffRoleBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  adminBadge: {
    backgroundColor: '#E3F2FD',
  },
  staffRoleText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text,
  },
  removeBtn: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});
