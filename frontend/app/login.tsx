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
import { useLanguage } from '../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (!name || name.trim().length < 2) {
      Alert.alert('Name Required', 'Please enter your name to continue');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms & Conditions to continue');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      const response = await fetch(`${BACKEND_URL}/api/auth/instant-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, name: name.trim(), role: 'admin' }),
      });
      const data = await response.json();
      if (data.success) {
        await login(data.user);
        router.replace('/(tabs)');
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Unable to login. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const canContinue = phone.length >= 10 && name.trim().length >= 2 && agreedToTerms;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{t('login.welcomeTo')}</Text>
            <Text style={[styles.appName, { color: theme.colors.primary }]}>Chadivimpulu™</Text>
            <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>{t('login.subtitle')}</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.colors.cardBackground, borderLeftColor: theme.colors.primary }]}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>{t('login.info')}</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.colors.text }]}>{t('login.phone')}</Text>
            <View style={[styles.phoneInput, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
              <Text style={[styles.countryCode, { color: theme.colors.text }]}>+91</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder={t('login.phonePlaceholder')}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
                placeholderTextColor={theme.colors.textSecondary}
                editable={!loading}
                autoFocus
              />
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>{t('login.name')}</Text>
            <TextInput
              style={[styles.input, styles.fullInput, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder={t('login.namePlaceholder')}
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.textSecondary}
              editable={!loading}
              autoCapitalize="words"
            />

            <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)} activeOpacity={0.7} disabled={loading}>
              <View style={[styles.checkbox, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }, agreedToTerms && { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }]}>
                {agreedToTerms && <Ionicons name="checkmark" size={16} color={theme.colors.white} />}
              </View>
              <Text style={[styles.termsText, { color: theme.colors.text }]}>
                {t('login.terms')}{' '}
                <Text style={[styles.termsLink, { color: theme.colors.primary }]}>{t('login.termsLink')}</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.secondary }, (!canContinue || loading) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={!canContinue || loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color={theme.colors.white} />
                  <Text style={[styles.buttonText, { color: theme.colors.white }]}>  {t('login.loggingIn')}</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonText, { color: theme.colors.white }]}>{t('login.continue')}</Text>
                  <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>{t('login.privacyNote')}</Text>
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
  title: { fontSize: 24, textAlign: 'center' },
  appName: { fontSize: 40, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  infoBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 32, borderLeftWidth: 4 },
  infoText: { flex: 1, fontSize: 14, marginLeft: 8 },
  form: { width: '100%' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  phoneInput: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 2, paddingHorizontal: 16 },
  countryCode: { fontSize: 18, fontWeight: '600', marginRight: 8 },
  input: { flex: 1, height: 50, fontSize: 18 },
  fullInput: { borderRadius: 12, borderWidth: 2, paddingHorizontal: 16 },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, paddingVertical: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  termsText: { flex: 1, fontSize: 14 },
  termsLink: { fontWeight: '600', textDecorationLine: 'underline' },
  button: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 32, elevation: 2 },
  buttonDisabled: { opacity: 0.6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonText: { fontSize: 18, fontWeight: '600' },
  privacyNote: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 16 },
  privacyText: { flex: 1, fontSize: 12, marginLeft: 8, textAlign: 'center' },
});
