import { View, FlatList, Button } from 'react-native';
import { useEffect, useState } from 'react';
import db from '../database/db';

export default function HomeScreen({ navigation }: any) {

  const [records, setRecords] = useState<any[]>([]);

  const loadData = () => {
    try {
      const data = db.getAllSync('SELECT * FROM bills');
      setRecords(data);
    } catch (error) {
      console.log('DB Error:', error);
    }
  };

  useEffect(() => {

    const unsubscribe = navigation.addListener('focus', loadData);

    loadData(); // initial load

    return unsubscribe;

  }, [navigation]);

  return (
    <View style={{ flex: 1, padding: 20 }}>

      <Button
        title="Add Record"
        onPress={() => navigation.navigate('Add')}
      />

      <FlatList
        data={records}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 20,
              marginVertical: 10,
              borderWidth: 1
            }}
          >

            <Button
              title="Edit"
              onPress={() =>
                navigation.navigate('Edit', item)
              }
            />

          </View>
        )}
      />

    </View>
  );
}