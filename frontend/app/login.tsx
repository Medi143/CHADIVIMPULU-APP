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
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      Alert.alert('Required', 'Please enter your mobile number or email');
      return;
    }
    if (!password) {
      Alert.alert('Required', 'Please enter your password');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms & Conditions');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await response.json();
      if (data.success) {
        await login(data.user);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', data.detail || data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canLogin = identifier.trim().length >= 5 && password.length >= 1 && agreedToTerms;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Welcome to</Text>
            <Text style={[styles.appName, { color: theme.colors.primary }]}>{'Chadivimpulu\u2122'}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>Digital Wed Gift Registry</Text>
          </View>

          <View style={styles.form}>
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

            <Text style={[styles.label, { color: theme.colors.text }]}>Password *</Text>
            <View style={[styles.passwordRow, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.colors.text }]}
                placeholder="Enter your password"
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

            <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotRow}>
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)} activeOpacity={0.7} disabled={loading}>
              <View style={[styles.checkbox, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }, agreedToTerms && { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }]}>
                {agreedToTerms && <Ionicons name="checkmark" size={16} color={theme.colors.white} />}
              </View>
              <Text style={[styles.termsText, { color: theme.colors.text }]}>
                I agree to the{' '}
                <Text style={[styles.termsLink, { color: theme.colors.primary }]}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.secondary }, (!canLogin || loading) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={!canLogin || loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.white }]}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={[styles.signupHint, { color: theme.colors.textSecondary }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={[styles.signupLink, { color: theme.colors.primary }]}>Sign Up</Text>
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
  header: { marginBottom: 32 },
  title: { fontSize: 22, textAlign: 'center' },
  appName: { fontSize: 38, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, textAlign: 'center' },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  textInput: { height: 50, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16 },
  passwordInput: { flex: 1, height: 50, fontSize: 16 },
  eyeButton: { padding: 8 },
  forgotRow: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { fontSize: 14, fontWeight: '600' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingVertical: 6 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  termsText: { flex: 1, fontSize: 13 },
  termsLink: { fontWeight: '600', textDecorationLine: 'underline' },
  button: { height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24, elevation: 2 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 18, fontWeight: '700' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupHint: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '700' },
});
