import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { theme } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, login, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      if (!user?._id) return;
      const response = await fetch(`${BACKEND_URL}/api/users/${user._id}`);
      const data = await response.json();
      if (data.success && data.user) {
        setName(data.user.name || '');
        setPhone(data.user.phone || '');
        setEmail(data.user.email || '');
        setProfilePhoto(data.user.profile_photo || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setFetchingProfile(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProfilePhoto(base64Uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Required', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        phone: phone.trim(),
      };
      if (email.trim()) payload.email = email.trim();
      if (profilePhoto) payload.profile_photo = profilePhoto;

      const response = await fetch(`${BACKEND_URL}/api/users/${user?._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        // Update local auth context with ALL fields including profile_photo
        await updateUser({
          name: name.trim(),
          phone: phone.trim(),
          profile_photo: profilePhoto || undefined,
        });
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        throw new Error(data.detail || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Photo */}
        <TouchableOpacity style={styles.photoSection} onPress={pickImage}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={50} color={theme.colors.white} />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={18} color={theme.colors.white} />
          </View>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.card}>
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="person-outline" size={18} color={theme.colors.secondary} />
              <Text style={styles.label}>Full Name</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="call-outline" size={18} color={theme.colors.secondary} />
              <Text style={styles.label}>Phone Number</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.secondary} />
              <Text style={styles.label}>Email Address</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter email address (optional)"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.white} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

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
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 25,
    right: '35%',
    backgroundColor: theme.colors.secondary,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  photoHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});
