import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { theme } from '../../constants/theme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Reports() {
  const { user, activeEvent } = useAuth();
  const { theme: appTheme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [analytics, setAnalytics] = useState<any>(null);
  const [dashStats, setDashStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'entries' | 'insights'>('entries');

  const eventId = activeEvent?._id || user?.current_event_id;

  const navigation = useNavigation();
  useEffect(() => {
    if (eventId) {
      loadAnalytics();
      loadDashboardStats();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (eventId) {
        setLoading(true);
        loadAnalytics();
        loadDashboardStats();
      }
    });
    return unsubscribe;
  }, [navigation, eventId]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reports/${eventId}`);
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

  const loadDashboardStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/dashboard/${eventId}`);
      const data = await response.json();
      if (data.success) {
        setDashStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const exportPDF = async () => {
    setExporting('pdf');
    try {
      const response = await fetch(`${BACKEND_URL}/api/export/pdf/${eventId}`);
      const data = await response.json();
      if (data.success && data.pdf_data) {
        const fileName = data.file_name || `Chadivimpulu_Report.pdf`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, data.pdf_data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save PDF Report',
            UTI: 'com.adobe.pdf',
          });
        }
        Alert.alert('PDF Exported', `File: ${fileName}`);
      } else {
        Alert.alert('Error', 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = async () => {
    setExporting('excel');
    try {
      const response = await fetch(`${BACKEND_URL}/api/export/excel/${eventId}`);
      const data = await response.json();
      if (data.success && data.excel_data) {
        const fileName = data.file_name || `Chadivimpulu_Report.xlsx`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, data.excel_data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Save Excel Report',
          });
        }
        Alert.alert('Excel Exported', `File: ${fileName}`);
      } else {
        Alert.alert('Error', 'Failed to generate Excel');
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      Alert.alert('Error', 'Failed to export Excel. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const mon = (d.getMonth() + 1).toString().padStart(2, '0');
    const yr = d.getFullYear().toString().slice(-2);
    const hr = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${mon}/${yr} ${hr}:${min}`;
  };

  if (!eventId) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: appTheme.colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: appTheme.colors.secondary, paddingTop: insets.top }]}>
          <Text style={[styles.headerBarTitle, { color: appTheme.colors.white }]}>{t('reports.title')}</Text>
        </View>
        <View style={styles.emptyContent}>
          <Ionicons name="analytics-outline" size={80} color={appTheme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: appTheme.colors.textSecondary }]}>{t('reports.noEvent')}</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: appTheme.colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: appTheme.colors.secondary, paddingTop: insets.top }]}>
          <Text style={[styles.headerBarTitle, { color: appTheme.colors.white }]}>{t('reports.title')}</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: appTheme.colors.background }]}>
      {/* 1. Header */}
      <View style={[styles.headerBar, { backgroundColor: appTheme.colors.secondary, paddingTop: insets.top }]}>
        <Text style={[styles.headerBarTitle, { color: appTheme.colors.white }]}>{t('reports.title')}</Text>
      </View>

      {/* 2. Tab Switcher (moved to top) */}
      <View style={[styles.tabRow, { backgroundColor: appTheme.colors.cardBackground }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'entries' && { backgroundColor: appTheme.colors.secondary }]}
          onPress={() => setActiveTab('entries')}
        >
          <Ionicons name="list" size={18} color={activeTab === 'entries' ? appTheme.colors.white : appTheme.colors.text} />
          <Text style={[styles.tabText, { color: activeTab === 'entries' ? appTheme.colors.white : appTheme.colors.text }]}>
            {t('reports.giftEntries')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && { backgroundColor: appTheme.colors.secondary }]}
          onPress={() => setActiveTab('insights')}
        >
          <Ionicons name="bulb" size={18} color={activeTab === 'insights' ? appTheme.colors.white : appTheme.colors.text} />
          <Text style={[styles.tabText, { color: activeTab === 'insights' ? appTheme.colors.white : appTheme.colors.text }]}>
            {t('reports.insights')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'entries' ? (
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {/* 3. Gift Entries Table */}
          <View style={styles.tableContainer}>
            <View style={[styles.tableHeader, { backgroundColor: appTheme.colors.secondary }]}>
              <Text style={[styles.tableHeaderCell, styles.cellSno, { color: appTheme.colors.white }]}>{t('reports.sno')}</Text>
              <Text style={[styles.tableHeaderCell, styles.cellName, { color: appTheme.colors.white }]}>{t('reports.name')}</Text>
              <Text style={[styles.tableHeaderCell, styles.cellArea, { color: appTheme.colors.white }]}>{t('reports.areaCol')}</Text>
              <Text style={[styles.tableHeaderCell, styles.cellAmount, { color: appTheme.colors.white }]}>{t('reports.amountCol')}</Text>
              <Text style={[styles.tableHeaderCell, styles.cellMode, { color: appTheme.colors.white }]}>{t('reports.mode')}</Text>
            </View>

            {analytics?.all_entries && analytics.all_entries.length > 0 ? (
              analytics.all_entries.map((item: any, index: number) => (
                <View key={item._id || index} style={[styles.tableRow, { backgroundColor: appTheme.colors.cardBackground, borderBottomColor: appTheme.colors.border }]}>
                  <Text style={[styles.tableCell, styles.cellSno, { color: appTheme.colors.text }]}>{item.s_no}</Text>
                  <Text style={[styles.tableCell, styles.cellName, { color: appTheme.colors.text }]} numberOfLines={1}>{item.guest_name}</Text>
                  <Text style={[styles.tableCell, styles.cellArea, { color: appTheme.colors.textSecondary }]} numberOfLines={1}>{item.area || '-'}</Text>
                  <Text style={[styles.tableCell, styles.cellAmount, { color: appTheme.colors.secondary }]}>
                    {item.gift_type === 'cash' ? `\u20b9${(item.amount || 0).toLocaleString()}` : (item.item_description || item.gift_item || '-')}
                  </Text>
                  <View style={[styles.tableCellView, styles.cellMode]}>
                    <View style={[styles.modeBadge, { backgroundColor: item.payment_mode === 'upi' ? '#E8F5E9' : (item.gift_type === 'item' ? '#E3F2FD' : '#FFF3E0') }]}>
                      <Text style={[styles.modeBadgeText, { color: item.payment_mode === 'upi' ? '#4CAF50' : (item.gift_type === 'item' ? '#2196F3' : '#FF8C00') }]}>
                        {item.gift_type === 'item' ? 'ITEM' : (item.payment_mode || 'N/A').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noData}>
                <Ionicons name="document-text-outline" size={48} color={appTheme.colors.textSecondary} />
                <Text style={[styles.noDataText, { color: appTheme.colors.textSecondary }]}>{t('reports.noData')}</Text>
              </View>
            )}
          </View>

          {/* 4. Summary Boxes (moved below table) */}
          {dashStats && (
            <View style={styles.summarySection}>
              <Text style={[styles.summaryTitle, { color: appTheme.colors.text }]}>Summary</Text>
              <View style={styles.dashStatsGrid}>
                <View style={[styles.dashStatCard, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="people" size={26} color="#4CAF50" />
                  <Text style={[styles.dashStatValue, { color: appTheme.colors.text }]}>{dashStats.total_guests}</Text>
                  <Text style={styles.dashStatLabel}>{t('reports.totalGuests')}</Text>
                </View>
                <View style={[styles.dashStatCard, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="cash" size={26} color="#FF9800" />
                  <Text style={[styles.dashStatValue, { color: appTheme.colors.text }]}>{'\u20b9'}{dashStats.total_cash?.toLocaleString()}</Text>
                  <Text style={styles.dashStatLabel}>{t('reports.totalCash')}</Text>
                </View>
                <View style={[styles.dashStatCard, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="gift" size={26} color="#2196F3" />
                  <Text style={[styles.dashStatValue, { color: appTheme.colors.text }]}>{dashStats.total_items}</Text>
                  <Text style={styles.dashStatLabel}>{t('reports.totalItems')}</Text>
                </View>
                <View style={[styles.dashStatCard, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="card" size={26} color="#9C27B0" />
                  <Text style={[styles.dashStatValue, { color: appTheme.colors.text }]}>{dashStats.payment_modes?.upi || 0}</Text>
                  <Text style={styles.dashStatLabel}>{t('reports.upiPayments')}</Text>
                </View>
              </View>

              <View style={styles.sideComparisonRow}>
                <View style={[styles.sideCompCard, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
                  <Text style={[styles.sideCompTitle, { color: appTheme.colors.text }]}>{t('reports.brideSide')}</Text>
                  <Text style={[styles.sideCompGuests, { color: appTheme.colors.textSecondary }]}>{dashStats.bride_side?.guests || 0} {t('reports.guests')}</Text>
                  <Text style={[styles.sideCompCash, { color: appTheme.colors.secondary }]}>{'\u20b9'}{(dashStats.bride_side?.cash || 0).toLocaleString()}</Text>
                </View>
                <View style={[styles.sideCompCard, { backgroundColor: appTheme.colors.cardBackground, borderColor: appTheme.colors.border }]}>
                  <Text style={[styles.sideCompTitle, { color: appTheme.colors.text }]}>{t('reports.groomSide')}</Text>
                  <Text style={[styles.sideCompGuests, { color: appTheme.colors.textSecondary }]}>{dashStats.groom_side?.guests || 0} {t('reports.guests')}</Text>
                  <Text style={[styles.sideCompCash, { color: appTheme.colors.secondary }]}>{'\u20b9'}{(dashStats.groom_side?.cash || 0).toLocaleString()}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.insightsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>{t('reports.insights')}</Text>
            {analytics?.insights && analytics.insights.length > 0 ? (
              analytics.insights.map((insight: string, index: number) => (
                <View key={index} style={[styles.insightCard, { backgroundColor: appTheme.colors.cardBackground }]}>
                  <Ionicons name="bulb" size={20} color={appTheme.colors.primary} />
                  <Text style={[styles.insightText, { color: appTheme.colors.text }]}>{insight}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noDataText, { color: appTheme.colors.textSecondary }]}>{t('reports.noInsights')}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>{t('reports.topContributors')}</Text>
            {analytics?.top_contributors && analytics.top_contributors.length > 0 ? (
              analytics.top_contributors.map((contributor: any, index: number) => (
                <View key={index} style={[styles.contributorCard, { backgroundColor: appTheme.colors.cardBackground }]}>
                  <View style={styles.rank}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.contributorInfo}>
                    <Text style={[styles.contributorName, { color: appTheme.colors.text }]}>{contributor.name}</Text>
                    <Text style={[styles.contributorSide, { color: appTheme.colors.textSecondary }]}>{contributor.side} {t('reports.side')}</Text>
                  </View>
                  <Text style={[styles.contributorAmount, { color: appTheme.colors.secondary }]}>{'\u20b9'}{contributor.amount?.toLocaleString()}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.noDataText, { color: appTheme.colors.textSecondary }]}>{t('reports.noContributors')}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: appTheme.colors.text }]}>{t('reports.statistics')}</Text>
            {analytics?.patterns && (
              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: appTheme.colors.cardBackground }]}>
                  <Text style={[styles.statItemValue, { color: appTheme.colors.text }]}>{analytics.patterns.cash_vs_items?.cash || 0}</Text>
                  <Text style={[styles.statItemLabel, { color: appTheme.colors.textSecondary }]}>{t('reports.cashGifts')}</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: appTheme.colors.cardBackground }]}>
                  <Text style={[styles.statItemValue, { color: appTheme.colors.text }]}>{analytics.patterns.cash_vs_items?.items || 0}</Text>
                  <Text style={[styles.statItemLabel, { color: appTheme.colors.textSecondary }]}>{t('reports.itemGifts')}</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: appTheme.colors.cardBackground }]}>
                  <Text style={[styles.statItemValue, { color: appTheme.colors.text }]}>{analytics.patterns.payment_modes?.cash || 0}</Text>
                  <Text style={[styles.statItemLabel, { color: appTheme.colors.textSecondary }]}>{t('reports.cashPayments')}</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: appTheme.colors.cardBackground }]}>
                  <Text style={[styles.statItemValue, { color: appTheme.colors.text }]}>{analytics.patterns.payment_modes?.upi || 0}</Text>
                  <Text style={[styles.statItemLabel, { color: appTheme.colors.textSecondary }]}>{t('reports.upiPayments')}</Text>
                </View>
              </View>
            )}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Export Buttons - Fixed at bottom */}
      <View style={[styles.exportSection, { backgroundColor: appTheme.colors.cardBackground, borderTopColor: appTheme.colors.border }]}>
        <TouchableOpacity
          style={[styles.exportButton, styles.pdfButton, exporting === 'pdf' && styles.exportButtonDisabled]}
          onPress={exportPDF}
          disabled={!!exporting}
        >
          {exporting === 'pdf' ? (
            <ActivityIndicator color={appTheme.colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="document-text" size={20} color={appTheme.colors.white} />
              <Text style={styles.exportButtonText}>{t('reports.exportPDF')}</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.exportButton, styles.excelButton, exporting === 'excel' && styles.exportButtonDisabled]}
          onPress={exportExcel}
          disabled={!!exporting}
        >
          {exporting === 'excel' ? (
            <ActivityIndicator color={appTheme.colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="document" size={20} color={appTheme.colors.white} />
              <Text style={styles.exportButtonText}>{t('reports.exportExcel')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1 },
  loadingContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1 },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  emptyText: { fontSize: theme.fontSize.md, textAlign: 'center', marginTop: theme.spacing.lg },
  headerBar: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  headerBarTitle: { fontSize: theme.fontSize.xl, fontWeight: 'bold' },
  // Tab row
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
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
  tabText: { fontSize: theme.fontSize.sm, fontWeight: '600' },
  // Scroll
  scrollArea: { flex: 1 },
  // Table
  tableContainer: { paddingHorizontal: theme.spacing.md },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
  },
  tableHeaderCell: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableCell: { fontSize: theme.fontSize.xs },
  tableCellView: {},
  cellSno: { width: 32, fontWeight: '700' },
  cellName: { flex: 2, paddingRight: 4 },
  cellArea: { flex: 1.2, paddingRight: 4 },
  cellAmount: { flex: 1.5, fontWeight: '600' },
  cellMode: { width: 54, alignItems: 'center' },
  modeBadge: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  modeBadgeText: { fontSize: 9, fontWeight: 'bold' },
  noData: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xl },
  noDataText: { fontSize: theme.fontSize.sm, marginTop: theme.spacing.sm },
  // Summary section (below table)
  summarySection: { padding: theme.spacing.md, marginTop: theme.spacing.md },
  summaryTitle: { fontSize: theme.fontSize.lg, fontWeight: 'bold', marginBottom: theme.spacing.md },
  dashStatsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dashStatCard: {
    width: '48%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    marginHorizontal: '1%',
    alignItems: 'center',
  },
  dashStatValue: { fontSize: theme.fontSize.xl, fontWeight: 'bold', marginTop: theme.spacing.sm },
  dashStatLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  sideComparisonRow: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  sideCompCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  sideCompTitle: { fontSize: theme.fontSize.md, fontWeight: '600', marginBottom: theme.spacing.sm },
  sideCompGuests: { fontSize: theme.fontSize.sm },
  sideCompCash: { fontSize: theme.fontSize.lg, fontWeight: 'bold', marginTop: theme.spacing.xs },
  // Insights
  insightsContainer: { flex: 1, paddingHorizontal: theme.spacing.md },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: 'bold', marginBottom: theme.spacing.md },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  insightText: { flex: 1, fontSize: theme.fontSize.sm, marginLeft: theme.spacing.md },
  contributorCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  rankText: { fontSize: theme.fontSize.sm, fontWeight: 'bold', color: theme.colors.text },
  contributorInfo: { flex: 1 },
  contributorName: { fontSize: theme.fontSize.md, fontWeight: '600' },
  contributorSide: { fontSize: theme.fontSize.xs, textTransform: 'capitalize' },
  contributorAmount: { fontSize: theme.fontSize.md, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  statItem: { width: '47%', padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  statItemValue: { fontSize: theme.fontSize.xl, fontWeight: 'bold' },
  statItemLabel: { fontSize: theme.fontSize.xs, marginTop: 4 },
  // Export
  exportSection: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderTopWidth: 1,
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
  pdfButton: { backgroundColor: theme.colors.error },
  excelButton: { backgroundColor: theme.colors.success },
  exportButtonDisabled: { opacity: 0.6 },
  exportButtonText: { color: theme.colors.white, fontSize: theme.fontSize.md, fontWeight: '600' },
});
