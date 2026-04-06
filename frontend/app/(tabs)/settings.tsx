import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRouter } from 'expo-router';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const MenuItem = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.cardBackground }]} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color={theme.colors.text} />
      <Text style={[styles.menuText, { color: theme.colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.profileSection, { backgroundColor: theme.colors.secondary }]}>
        {user?.profile_photo ? (
          <Image source={{ uri: user.profile_photo }} style={[styles.avatarImage, { borderColor: theme.colors.primary }]} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="person" size={60} color={theme.colors.white} />
          </View>
        )}
        <Text style={[styles.name, { color: theme.colors.white }]}>{user?.name}</Text>
        <Text style={[styles.phone, { color: theme.colors.white }]}>{user?.phone}</Text>
        <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.menuList}>
        <MenuItem icon="person-outline" label={t('settings.editProfile')} onPress={() => router.push('/edit-profile')} />
        <MenuItem icon="lock-closed-outline" label={t('settings.privacy')} onPress={() => router.push('/privacy-security')} />
        <MenuItem icon="qr-code-outline" label={t('settings.eventQR')} onPress={() => router.push('/event-qr')} />
        <MenuItem icon="notifications-outline" label={t('settings.notifications')} onPress={() => router.push('/notifications-settings')} />
        <MenuItem icon="help-circle-outline" label={t('settings.help')} onPress={() => router.push('/help-support')} />
        <MenuItem icon="information-circle-outline" label={t('settings.about')} onPress={() => router.push('/about')} />
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.colors.error }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={theme.colors.white} />
        <Text style={[styles.logoutText, { color: theme.colors.white }]}>{t('settings.logout')}</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: theme.colors.textSecondary }]}>{t('settings.version')} 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: { alignItems: 'center', padding: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, marginBottom: 16 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  phone: { fontSize: 16, opacity: 0.8, marginBottom: 16 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },
  menuList: { paddingHorizontal: 24, paddingTop: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  menuText: { flex: 1, fontSize: 16, marginLeft: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, marginTop: 32, padding: 16, borderRadius: 12 },
  logoutText: { fontSize: 18, fontWeight: '600', marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 14, marginTop: 32, marginBottom: 32 },
});
