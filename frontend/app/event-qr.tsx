import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function EventQRScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeEvent } = useAuth();
  const qrRef = useRef<any>(null);

  const eventId = activeEvent?._id;
  const eventName = activeEvent?.name || activeEvent?.event_name || 'Event';
  const qrValue = eventId ? `chadivimpulu://event/${eventId}` : 'chadivimpulu://app';

  const getQRBase64 = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (qrRef.current) {
        qrRef.current.toDataURL((data: string) => {
          resolve(data);
        });
      } else {
        reject(new Error('QR ref not available'));
      }
    });
  };

  const handleDownload = async () => {
    try {
      const base64 = await getQRBase64();
      const safeName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Chadivimpulu_${safeName}_QR.png`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Save QR Code',
        });
      }
      Alert.alert('Success', `QR Code saved as ${fileName}`);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download QR Code');
    }
  };

  const handleShare = async () => {
    try {
      const base64 = await getQRBase64();
      const safeName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Chadivimpulu_${safeName}_QR.png`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Event QR Code',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share QR Code');
    }
  };

  if (!eventId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="qr-code-outline" size={60} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>Please select an active event first</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Event Name */}
        <View style={styles.eventBadge}>
          <Ionicons name="calendar" size={20} color={theme.colors.secondary} />
          <Text style={styles.eventName}>{eventName}</Text>
        </View>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrBorder}>
            <QRCode
              value={qrValue}
              size={220}
              backgroundColor="white"
              color={theme.colors.secondary}
              getRef={(ref: any) => (qrRef.current = ref)}
            />
          </View>
          <Text style={styles.qrLabel}>Scan to access event</Text>
          <Text style={styles.qrEventId}>Event ID: {eventId}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
            <Ionicons name="download-outline" size={22} color={theme.colors.white} />
            <Text style={styles.btnText}>Download QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color={theme.colors.white} />
            <Text style={styles.btnText}>Share QR</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hintText}>
          Share this QR code with guests so they can quickly access the event.
        </Text>
      </View>
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  eventName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  qrCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: theme.spacing.xl,
  },
  qrBorder: {
    padding: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  qrLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  qrEventId: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    elevation: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    elevation: 2,
  },
  btnText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.white,
  },
  hintText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 22,
  },
});
