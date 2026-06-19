import { View, TextInput, Button } from 'react-native';
import { useState } from 'react';
import db from '../database/db';
import { router } from 'expo-router';

export default function Add() {

  const [acc, setAcc] = useState('');
  const [due, setDue] = useState('');
  const [pre, setPre] = useState('');
  const [cur, setCur] = useState('');

  const save = () => {
    db.runSync(
      `INSERT INTO bills (accNumber, dueBill, previousReading, currentReading)
       VALUES (?, ?, ?, ?)`,
      [acc, due, pre, cur]
    );

    router.back(); // return to home
  };

  return (
    <View style={{ padding: 20 }}>

      <TextInput placeholder="Account" onChangeText={setAcc} />
      <TextInput placeholder="Due" onChangeText={setDue} />
      <TextInput placeholder="Previous" onChangeText={setPre} />
      <TextInput placeholder="Current" onChangeText={setCur} />

      <Button title="Save" onPress={save} />

    </View>
  );
}