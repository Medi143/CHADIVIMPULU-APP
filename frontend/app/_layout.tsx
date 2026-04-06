import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { StatusBar } from 'expo-status-bar';

function InnerLayout() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'light'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="create-event" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="gift-entry" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="privacy-security" />
        <Stack.Screen name="manage-staff" />
        <Stack.Screen name="help-support" />
        <Stack.Screen name="about" />
        <Stack.Screen name="event-qr" />
        <Stack.Screen name="notifications-settings" />
        <Stack.Screen name="language-settings" />
        <Stack.Screen name="theme-settings" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <InnerLayout />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
