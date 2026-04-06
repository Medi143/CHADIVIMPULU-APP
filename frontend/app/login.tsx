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
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validate phone number
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    // Validate name
    if (!name || name.trim().length < 2) {
      Alert.alert('Name Required', 'Please enter your name to continue');
      return;
    }

    // Validate T&C
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms & Conditions to continue');
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

      // Direct login - no OTP verification
      const response = await fetch(`${BACKEND_URL}/api/auth/instant-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
          name: name.trim(),
          role: 'admin',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save user session using simplified login
        await login(data.user);
        
        // Navigate to dashboard
        router.replace('/(tabs)');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Unable to login. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const canContinue = phone.length >= 10 && name.trim().length >= 2 && agreedToTerms;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.appName}>Chadivimpulu</Text>
            <Text style={styles.subtitle}>Digital Wed Gift Registry</Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Enter your mobile number to continue. No OTP required!
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Phone Number Input */}
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.phoneInput}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
                placeholderTextColor={theme.colors.textSecondary}
                editable={!loading}
                autoFocus
              />
            </View>

            {/* Name Input */}
            <Text style={styles.label}>Your Name *</Text>
            <TextInput
              style={[styles.input, styles.fullInput]}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.textSecondary}
              editable={!loading}
              autoCapitalize="words"
            />

            {/* Terms & Conditions Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.button, (!canContinue || loading) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={!canContinue || loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color={theme.colors.white} />
                  <Text style={styles.buttonText}>  Logging in...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
                </View>
              )}
            </TouchableOpacity>

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.privacyText}>
                Your information is stored securely. You'll stay logged in on this device.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
    textAlign: 'center',
  },
  appName: {
    fontSize: theme.fontSize.xxl + 8,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  countryCode: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
  },
  fullInput: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  termsText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: theme.colors.secondary,
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  privacyText: {
    flex: 1,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    textAlign: 'center',
  },
});
