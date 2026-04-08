import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ForgotPassword() {
  const router = useRouter();
  const { theme } = useTheme();
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Required', 'Please enter a valid mobile number');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), new_password: newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Password Updated', 'Your password has been reset. Please sign in.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      } else {
        Alert.alert('Error', data.detail || data.message || 'Please try again');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canReset = phone.trim().length >= 10 && newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="lock-open-outline" size={48} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Enter your mobile number and create a new password</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Mobile Number *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Enter registered mobile number"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor={theme.colors.textSecondary}
              editable={!loading}
              keyboardType="phone-pad"
              maxLength={15}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>Create New Password *</Text>
            <View style={[styles.passwordRow, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="Min 6 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                placeholderTextColor={theme.colors.textSecondary}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeButton}>
                <Ionicons name={showNew ? 'eye-off' : 'eye'} size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>Confirm New Password *</Text>
            <View style={[styles.passwordRow, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholderTextColor={theme.colors.textSecondary}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
                <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.secondary }, (!canReset || loading) && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={!canReset || loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.white }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 50, left: 24, zIndex: 10, padding: 8 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  textInput: { height: 50, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16 },
  passwordInput: { flex: 1, height: 50, fontSize: 16 },
  eyeButton: { padding: 8 },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 6 },
  button: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 28, elevation: 2 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 18, fontWeight: '700' },
});
