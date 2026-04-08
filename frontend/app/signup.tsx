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

export default function SignUp() {
  const router = useRouter();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || name.trim().length < 2) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }
    if (!identifier.trim() || identifier.trim().length < 5) {
      Alert.alert('Required', 'Please enter a valid mobile number or email');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), identifier: identifier.trim(), password }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Registration Successful', 'Your account has been created. Please sign in.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      } else {
        Alert.alert('Registration Failed', data.detail || data.message || 'Please try again');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canRegister = name.trim().length >= 2 && identifier.trim().length >= 5 && password.length >= 6 && password === confirmPassword;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.appName, { color: theme.colors.primary }]}>{'Chadivimpulu\u2122'}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>Create Your Account</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Full Name *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.textSecondary}
              editable={!loading}
              autoCapitalize="words"
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>Mobile Number or Email *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Enter mobile number or email"
              value={identifier}
              onChangeText={setIdentifier}
              placeholderTextColor={theme.colors.textSecondary}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>Create Password *</Text>
            <View style={[styles.passwordRow, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="Min 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={theme.colors.textSecondary}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>Confirm Password *</Text>
            <View style={[styles.passwordRow, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="Re-enter password"
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
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.secondary }, (!canRegister || loading) && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={!canRegister || loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.white }]}>Register</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={[styles.loginHint, { color: theme.colors.textSecondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={[styles.loginLink, { color: theme.colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
  header: { marginBottom: 28 },
  appName: { fontSize: 34, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 16, textAlign: 'center' },
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
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginHint: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '700' },
});
