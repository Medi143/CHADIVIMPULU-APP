import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
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
  const [activeTab, setActiveTab] = useState<'entries' | 'insights'>('entries');

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

  const renderEntryRow = ({ item }: { item: any }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.cellSno]}>{item.s_no}</Text>
      <Text style={[styles.tableCell, styles.cellName]} numberOfLines={1}>{item.guest_name}</Text>
      <Text style={[styles.tableCell, styles.cellArea]} numberOfLines={1}>{item.area || '-'}</Text>
      <Text style={[styles.tableCell, styles.cellAmount]}>
        {item.gift_type === 'cash' ? `\u20b9${(item.amount || 0).toLocaleString()}` : 'Item'}
      </Text>
      <View style={[styles.tableCell, styles.cellMode]}>
        <View style={[
          styles.modeBadge,
          { backgroundColor: item.payment_mode === 'upi' ? '#E8F5E9' : '#FFF3E0' }
        ]}>
          <Text style={[
            styles.modeBadgeText,
            { color: item.payment_mode === 'upi' ? '#4CAF50' : '#FF8C00' }
          ]}>
            {(item.payment_mode || 'N/A').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  const totalCash = analytics?.patterns?.total_cash || 0;
  const totalEntries = analytics?.patterns?.total_entries || 0;

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.summaryValue}>{totalEntries}</Text>
          <Text style={styles.summaryLabel}>Total Entries</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={styles.summaryValue}>{'\u20b9'}{totalCash.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Cash</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'entries' && styles.tabActive]}
          onPress={() => setActiveTab('entries')}
        >
          <Ionicons name="list" size={18} color={activeTab === 'entries' ? theme.colors.white : theme.colors.text} />
          <Text style={[styles.tabText, activeTab === 'entries' && styles.tabTextActive]}>
            Gift Entries
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
          onPress={() => setActiveTab('insights')}
        >
          <Ionicons name="bulb" size={18} color={activeTab === 'insights' ? theme.colors.white : theme.colors.text} />
          <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>
            Insights
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'entries' ? (
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellSno]}>S.No</Text>
            <Text style={[styles.tableHeaderCell, styles.cellName]}>Name</Text>
            <Text style={[styles.tableHeaderCell, styles.cellArea]}>Area</Text>
            <Text style={[styles.tableHeaderCell, styles.cellAmount]}>Amount</Text>
            <Text style={[styles.tableHeaderCell, styles.cellMode]}>Mode</Text>
          </View>

          {/* Table Body */}
          {analytics?.all_entries && analytics.all_entries.length > 0 ? (
            <FlatList
              data={analytics.all_entries}
              renderItem={renderEntryRow}
              keyExtractor={(item) => item._id || String(item.s_no)}
              contentContainerStyle={styles.tableBody}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noData}>
              <Ionicons name="document-text-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.noDataText}>No gift entries yet</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView style={styles.insightsContainer} showsVerticalScrollIndicator={false}>
          {/* Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights</Text>
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

          {/* Top Contributors */}
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
                  <Text style={styles.contributorAmount}>
                    {'\u20b9'}{contributor.amount?.toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No contributors yet</Text>
            )}
          </View>

          {/* Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            {analytics?.patterns && (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>{analytics.patterns.cash_vs_items?.cash || 0}</Text>
                  <Text style={styles.statItemLabel}>Cash Gifts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>{analytics.patterns.cash_vs_items?.items || 0}</Text>
                  <Text style={styles.statItemLabel}>Item Gifts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>{analytics.patterns.payment_modes?.cash || 0}</Text>
                  <Text style={styles.statItemLabel}>Cash Payments</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statItemValue}>{analytics.patterns.payment_modes?.upi || 0}</Text>
                  <Text style={styles.statItemLabel}>UPI Payments</Text>
                </View>
              </View>
            )}
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Export Buttons - Fixed at bottom */}
      <View style={styles.exportSection}>
        <TouchableOpacity
          style={[styles.exportButton, styles.pdfButton, exporting && styles.exportButtonDisabled]}
          onPress={exportPDF}
          disabled={exporting}
        >
          <Ionicons name="document-text" size={20} color={theme.colors.white} />
          <Text style={styles.exportButtonText}>PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, styles.excelButton, exporting && styles.exportButtonDisabled]}
          onPress={exportExcel}
          disabled={exporting}
        >
          <Ionicons name="document" size={20} color={theme.colors.white} />
          <Text style={styles.exportButtonText}>Excel</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  summaryRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  summaryLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    backgroundColor: '#F0F0F0',
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    gap: 6,
  },
  tabActive: {
    backgroundColor: theme.colors.secondary,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  // Table styles
  tableContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
  },
  tableHeaderCell: {
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  tableBody: {
    paddingBottom: 80,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  cellSno: {
    width: 40,
    fontWeight: '700',
  },
  cellName: {
    flex: 2,
    paddingRight: 8,
  },
  cellArea: {
    flex: 1.5,
    paddingRight: 8,
  },
  cellAmount: {
    flex: 1.5,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  cellMode: {
    width: 60,
    alignItems: 'center',
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  noData: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  noDataText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  // Insights Tab
  insightsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
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
    fontSize: theme.fontSize.sm,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rankText: {
    fontSize: theme.fontSize.sm,
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
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  contributorAmount: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statItem: {
    width: '47%',
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  statItemValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statItemLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  // Export Section
  exportSection: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  pdfButton: {
    backgroundColor: theme.colors.error,
  },
  excelButton: {
    backgroundColor: theme.colors.success,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
  },
});
