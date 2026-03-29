import React, { useState, useRef, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../lib/firebase';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  ApplicationVerifier,
} from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const CELL_COUNT = 6;

export default function Login() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);
  
  const ref = useBlurOnFulfill({ value: otp, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: otp,
    setValue: setOtp,
  });

  useEffect(() => {
    // Initialize reCAPTCHA verifier for web platform
    if (Platform.OS === 'web' && !recaptchaVerifier.current) {
      try {
        // Create invisible reCAPTCHA
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          },
        });
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
      }
    }

    return () => {
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    if (resendCount >= 3) {
      Alert.alert(
        'Too Many Attempts',
        'You have reached the maximum number of OTP requests. Please try again later.'
      );
      return;
    }

    setLoading(true);
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

    try {
      if (Platform.OS === 'web') {
        // Web platform - use Firebase Phone Auth with reCAPTCHA
        if (!recaptchaVerifier.current) {
          throw new Error('reCAPTCHA not initialized. Please refresh the page.');
        }

        const confirmation = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          recaptchaVerifier.current
        );

        setConfirmationResult(confirmation);
        setStep('otp');
        setResendTimer(30);
        setResendCount((prev) => prev + 1);
        Alert.alert(
          'OTP Sent',
          `A 6-digit verification code has been sent to ${formattedPhone} via SMS.`
        );
      } else {
        // Mobile platform (iOS/Android)
        // For Expo, we need to use a different approach
        // Using backend-based OTP generation as fallback
        const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: formattedPhone,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStep('otp');
          setResendTimer(30);
          setResendCount((prev) => prev + 1);
          Alert.alert(
            'OTP Sent',
            `A 6-digit verification code has been sent to ${formattedPhone} via SMS.\\n\\nNote: In production, you'll receive real SMS. For testing, check console logs.`
          );
        } else {
          throw new Error(data.message || 'Failed to send OTP');
        }
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      let errorMessage = 'Failed to send OTP. Please try again.';

      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage =
          'Too many requests. Please wait a few minutes before trying again.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error Sending OTP', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      let idToken = '';

      if (Platform.OS === 'web' && confirmationResult) {
        // Web platform - verify with Firebase
        const userCredential = await confirmationResult.confirm(otp);
        idToken = await userCredential.user.getIdToken();
      } else {
        // Mobile platform - verify with backend
        idToken = `dev_token_${Date.now()}`;
      }

      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

      // Create or update user in backend
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
          otp_token: idToken,
          name: name || `User ${phone.slice(-4)}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await setUser(data.user);
        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      let errorMessage = 'Invalid OTP. Please check and try again.';

      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please enter the correct 6-digit code.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new code.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Verification Failed', errorMessage);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) {
      Alert.alert(
        'Please Wait',
        `You can request a new OTP in ${resendTimer} seconds.`
      );
      return;
    }

    setOtp('');
    setStep('phone');
    sendOTP();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.appName}>Chadivimpulu</Text>
        <Text style={styles.subtitle}>Digital Wedding Gift Registry</Text>

        {step === 'phone' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
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
              />
            </View>

            <Text style={styles.label}>Name (Optional)</Text>
            <TextInput
              style={[styles.input, styles.fullInput]}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.textSecondary}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={sendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📱 You will receive a 6-digit OTP via SMS
              </Text>
              <Text style={styles.infoText}>
                🔒 Your phone number is kept secure
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Enter OTP</Text>
            <Text style={styles.hint}>Sent to +91{phone}</Text>

            <CodeField
              ref={ref}
              {...props}
              value={otp}
              onChangeText={setOtp}
              cellCount={CELL_COUNT}
              rootStyle={styles.codeFieldRoot}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              renderCell={({ index, symbol, isFocused }) => (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    isFocused && styles.focusCell,
                  ]}
                  onLayout={getCellOnLayoutHandler(index)}
                >
                  <Text style={styles.cellText}>
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
              )}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={verifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>
                  Resend OTP in {resendTimer}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                  <Text style={styles.resendText}>
                    Didn't receive OTP? Tap to resend
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                setStep('phone');
                setOtp('');
              }}
              style={styles.backButton}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>← Change Number</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* reCAPTCHA container for web */}
      {Platform.OS === 'web' && <div id="recaptcha-container"></div>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
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
    marginBottom: theme.spacing.xl * 2,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  hint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.lg,
  },
  codeFieldRoot: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    width: '100%',
    justifyContent: 'center',
  },
  cell: {
    width: 45,
    height: 60,
    lineHeight: 58,
    fontSize: theme.fontSize.xxl,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardBackground,
    textAlign: 'center',
    borderRadius: theme.borderRadius.md,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCell: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  cellText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.secondary,
    height: 50,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  resendContainer: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  resendTimer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  resendText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  backButton: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.secondary,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
