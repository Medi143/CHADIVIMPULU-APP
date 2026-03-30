import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="create-event" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="gift-entry" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
