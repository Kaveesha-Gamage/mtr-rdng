import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { database } from '../database/database';

export default function HomeScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch all documents from your 'players' (or 'bills') table
      const data = await database.get('players').query().fetch();
      
      // Extract the raw backend data values from the WatermelonDB models
      const rawRecords = data.map((model: any) => model._raw);
      setRecords(rawRecords);
    } catch (error) {
      console.log('DB Read Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Records</Text>
      
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No data found in backend.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Change these keys ('name', 'age') to match your backend schema keys */}
            <Text style={styles.nameText}>Name: {item.name}</Text>
            <Text style={styles.subText}>Age: {item.age}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  nameText: { fontSize: 18, fontWeight: '600' },
  subText: { fontSize: 14, color: '#666', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 }
});