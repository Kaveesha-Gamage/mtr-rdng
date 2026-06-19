import { View, FlatList, Button, Text } from 'react-native';
import { useEffect, useState } from 'react';
import db from '../database/db';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function Home() {
  const [records, setRecords] = useState<any[]>([]);

  const loadData = () => {
    const data = db.getAllSync('SELECT * FROM bills');
    setRecords(data);
  };

  // 🔥 AUTO REFRESH WHEN SCREEN FOCUSED
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const deleteRecord = (id: number) => {
    db.runSync('DELETE FROM bills WHERE id=?', [id]);
    loadData(); // instant refresh
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>

      <Button title="Add Record" onPress={() => router.push('/AddRecord')} />

      <FlatList
        data={records}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 15,
              marginVertical: 8,
              borderWidth: 1,
              borderRadius: 8
            }}
          >

            <Text>Acc: {item.accNumber}</Text>
            <Text>Due: {item.dueBill}</Text>
            <Text>Prev: {item.previousReading}</Text>
            <Text>Curr: {item.currentReading}</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>

              <Button
                title="Edit"
                onPress={() => router.push(`/EditRecord?id=${item.id}`)}
              />

              <Button
                title="Delete"
                onPress={() => deleteRecord(item.id)}
              />

            </View>

          </View>
        )}
      />
    </View>
  );
}