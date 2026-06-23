import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { seedPlayers, getPlayers } from '../services/playerService';

export default function HomeScreen() {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    await seedPlayers(); // insert 5 records
    const data = await getPlayers(); // retrieve records
    setPlayers(data);
  };

  return (
    <View style={{ padding: 20 }}>
      {players.map(player => (
        <Text key={player.id}>
          {player.name} - {player.age}
        </Text>
      ))}
    </View>
  );
}