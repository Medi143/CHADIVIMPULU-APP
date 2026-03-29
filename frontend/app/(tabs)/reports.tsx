import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Reports() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.current_event_id) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reports/${user?.current_event_id}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/export/pdf/${user?.current_event_id}`);
      const data = await response.json();

      if (data.success && data.pdf_data) {
        const fileUri = FileSystem.documentDirectory + 'gift_report.pdf';
        await FileSystem.writeAsStringAsync(fileUri, data.pdf_data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        await Sharing.shareAsync(fileUri);
        Alert.alert('Success', 'PDF exported successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/export/excel/${user?.current_event_id}`);
      const data = await response.json();

      if (data.success && data.excel_data) {
        const fileUri = FileSystem.documentDirectory + 'gift_report.xlsx';
        await FileSystem.writeAsStringAsync(fileUri, data.excel_data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        await Sharing.shareAsync(fileUri);
        Alert.alert('Success', 'Excel exported successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  if (!user?.current_event_id) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="analytics-outline" size={80} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>Please create an event first</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Insights</Text>
        {analytics?.insights && analytics.insights.length > 0 ? (
          analytics.insights.map((insight: string, index: number) => (
            <View key={index} style={styles.insightCard}>
              <Ionicons name="bulb" size={20} color={theme.colors.primary} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No insights available yet</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Contributors</Text>
        {analytics?.top_contributors && analytics.top_contributors.length > 0 ? (
          analytics.top_contributors.map((contributor: any, index: number) => (
            <View key={index} style={styles.contributorCard}>
              <View style={styles.rank}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.contributorInfo}>
                <Text style={styles.contributorName}>{contributor.name}</Text>
                <Text style={styles.contributorSide}>{contributor.side} side</Text>
              </View>
              <Text style={styles.contributorAmount}>₹{contributor.amount?.toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No contributors yet</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patterns & Statistics</Text>
        {analytics?.patterns && (
          <View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Entries</Text>
              <Text style={styles.statValue}>{analytics.patterns.total_entries}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cash Gifts</Text>
              <Text style={styles.statValue}>{analytics.patterns.cash_vs_items?.cash || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Item Gifts</Text>
              <Text style={styles.statValue}>{analytics.patterns.cash_vs_items?.items || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cash Payments</Text>
              <Text style={styles.statValue}>{analytics.patterns.payment_modes?.cash || 0}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>UPI Payments</Text>
              <Text style={styles.statValue}>{analytics.patterns.payment_modes?.upi || 0}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Reports</Text>
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={exportPDF}
          disabled={exporting}
        >
          <Ionicons name="document-text" size={24} color={theme.colors.white} />
          <Text style={styles.exportButtonText}>Export as PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, styles.excelButton, exporting && styles.exportButtonDisabled]}
          onPress={exportExcel}
          disabled={exporting}
        >
          <Ionicons name="document" size={24} color={theme.colors.white} />
          <Text style={styles.exportButtonText}>Export as Excel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  contributorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  rank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rankText: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  contributorSide: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  contributorAmount: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  noDataText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  excelButton: {
    backgroundColor: theme.colors.success,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});
