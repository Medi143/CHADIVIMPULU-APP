import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../constants/theme';

export default function EventQRScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeEvent } = useAuth();
  const { theme: appTheme } = useTheme();
  const qrRef = useRef<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const eventName = activeEvent?.name || 'My Event';
  const qrValue = `chadivimpulu://event/${activeEvent?._id || 'demo'}`;
  const safeEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_');

  const getQRBase64 = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!qrRef.current) {
        reject(new Error('QR code not ready'));
        return;
      }
      try {
        qrRef.current.toDataURL((data: string) => {
          if (data) {
            resolve(data);
          } else {
            reject(new Error('Empty QR data'));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save QR code to your gallery.');
        setDownloading(false);
        return;
      }

      const base64Data = await getQRBase64();
      const fileName = `Chadivimpulu_QR_${safeEventName}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save to media library (gallery)
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      if (asset) {
        Alert.alert('QR Code Downloaded Successfully', `Saved as ${fileName} to your gallery.`);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Unable to generate QR. Please try again');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const base64Data = await getQRBase64();
      const fileName = `Chadivimpulu_QR_${safeEventName}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const shareMessage = `You are invited to contribute your gift digitally via Chadivimpulu\u2122\n\nPlease scan the QR code or install the app:\n\nDownload App:\nhttps://play.google.com/store/apps/details?id=com.chadivimpulu.app\n\nMake your gifting easy and digital \uD83D\uDC9B`;

      // Try sharing image + text
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: shareMessage,
          UTI: 'public.png',
        });
      } else {
        // Fallback to text-only share
        await Share.share({
          message: shareMessage,
          title: 'Chadivimpulu\u2122 Event QR',
        });
      }
    } catch (error: any) {
      console.error('Share error:', error);
      if (error.message !== 'User did not share') {
        Alert.alert('Unable to generate QR. Please try again');
      }
    } finally {
      setSharing(false);
    }
  };

  if (!activeEvent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: appTheme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: appTheme.colors.secondary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={appTheme.colors.white} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: appTheme.colors.white }]}>Event QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={80} color={appTheme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: appTheme.colors.textSecondary }]}>
            Create an event first to generate QR code
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: appTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: appTheme.colors.secondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={appTheme.colors.white} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: appTheme.colors.white }]}>Event QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Event Info */}
        <View style={[styles.eventInfoCard, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Ionicons name="calendar" size={24} color={appTheme.colors.primary} />
          <View style={styles.eventInfoText}>
            <Text style={[styles.eventName, { color: appTheme.colors.text }]}>{eventName}</Text>
            <Text style={[styles.eventDetails, { color: appTheme.colors.textSecondary }]}>
              {activeEvent?.event_type?.charAt(0).toUpperCase() + activeEvent?.event_type?.slice(1)}
              {activeEvent?.date ? ` \u2022 ${activeEvent.date}` : ''}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={[styles.qrContainer, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.qrTitle, { color: appTheme.colors.text }]}>Scan to Join Event</Text>
          <View style={styles.qrWrapper}>
            <QRCode
              value={qrValue}
              size={200}
              backgroundColor="white"
              color={appTheme.colors.secondary}
              getRef={(ref: any) => (qrRef.current = ref)}
            />
          </View>
          <Text style={[styles.qrHint, { color: appTheme.colors.textSecondary }]}>
            Share this QR code with guests to invite them
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: appTheme.colors.secondary }]}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color={appTheme.colors.white} size="small" />
            ) : (
              <Ionicons name="download-outline" size={22} color={appTheme.colors.white} />
            )}
            <Text style={[styles.actionButtonText, { color: appTheme.colors.white }]}>
              {downloading ? 'Saving...' : 'Download QR'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: appTheme.colors.success || '#4CAF50' }]}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator color={appTheme.colors.white} size="small" />
            ) : (
              <Ionicons name="share-social-outline" size={22} color={appTheme.colors.white} />
            )}
            <Text style={[styles.actionButtonText, { color: appTheme.colors.white }]}>
              {sharing ? 'Preparing...' : 'Share QR'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Share Preview Message */}
        <View style={[styles.sharePreview, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
          <Text style={[styles.sharePreviewTitle, { color: appTheme.colors.text }]}>Share Message Preview</Text>
          <Text style={[styles.sharePreviewText, { color: appTheme.colors.textSecondary }]}>
            You are invited to contribute your gift digitally via Chadivimpulu{'\u2122'}{'\n\n'}
            Please scan the QR code or install the app:{'\n\n'}
            Download App:{'\n'}
            https://play.google.com/store/apps/details?id=com.chadivimpulu.app{'\n\n'}
            Make your gifting easy and digital {'\uD83D\uDC9B'}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: { padding: theme.spacing.sm },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
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
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  eventInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  eventInfoText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  eventName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
  },
  eventDetails: {
    fontSize: theme.fontSize.sm,
    marginTop: 4,
  },
  qrContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  qrTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  qrWrapper: {
    padding: theme.spacing.lg,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
  },
  qrHint: {
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  actionButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
  sharePreview: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  sharePreviewTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  sharePreviewText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 22,
  },
});
