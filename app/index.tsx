import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  RefreshControl
} from 'react-native';
import { database } from '../database/database';

export default function HomeScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Fetches everything from your players collection
      const data = await database.get('players').query().fetch();
      
      // Converts WatermelonDB models to plain objects for the list
      const rawRecords = data.map((model: any) => model._raw);
      setRecords(rawRecords);
    } catch (error) {
      console.log('DB Read Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute quick total and average stats for the summary bar
  const totalRecords = records.length;
  const avgAge = totalRecords > 0 
    ? Math.round(records.reduce((sum, item) => sum + (item.age || 0), 0) / totalRecords) 
    : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Syncing backend data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Database Viewer</Text>
        <Text style={styles.headerSubtitle}>Real-time local backend records</Text>
      </View>

      {/* Summary Dashboard Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalRecords}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{avgAge} yrs</Text>
          <Text style={styles.statLabel}>Avg. Metric</Text>
        </View>
      </View>

      {/* Main Records List */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Records Found</Text>
            <Text style={styles.emptySubtitle}>Pull down to refresh or check your backend seed data.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.recordCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.recordName}>{item.name || 'Unknown Name'}</Text>
              <Text style={styles.recordMeta}>Age / Parameter: {item.age ?? 'N/A'}</Text>
              <Text style={styles.idText}>ID: {item.id}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>#{index + 1}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 15, fontWeight: '500' },
  
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  
  statsContainer: { flexDirection: 'row', paddingHorizontal: 24, marginVertical: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#4F46E5' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '500' },
  
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  avatarContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  cardInfo: { flex: 1, marginLeft: 16 },
  recordName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  recordMeta: { fontSize: 14, color: '#64748B', marginTop: 2 },
  idText: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontFamily: 'monospace' },
  badge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});