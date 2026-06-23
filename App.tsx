import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import { initDatabase } from './database/database';

export default function App() {
  useEffect(() => {
    // Initialize your WatermelonDB instance when the app starts
    initDatabase();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <HomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});