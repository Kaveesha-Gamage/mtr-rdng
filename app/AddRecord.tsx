import { View, TextInput, Button, Alert } from 'react-native';
import { useState } from 'react';
import db from '../database/db';
import { router } from 'expo-router';

export default function Add() {

  const [acc, setAcc] = useState('');
  const [due, setDue] = useState('');
  const [pre, setPre] = useState('');
  const [cur, setCur] = useState('');

  const save = () => {

   console.log('acc=', acc);
    console.log('due=', due);
    console.log('pre=', pre);
    console.log('cur=', cur);

    const prev = Number(pre);
    const curr = Number(cur);
    const dueBill = Number(due);

    console.log('converted:', {
      prev,
      curr,
      dueBill
    });

    if (prev <= 0) {
      alert('Previous must be > 0');
      return;
    }

    if (curr <= 0) {
      alert('Current must be > 0');
      return;
    }

    if (curr < prev) {
      alert('Current must be ≥ Previous');
      return;
    }

    db.runSync(
      `
        INSERT INTO bills
        (
          accNumber,
          dueBill,
          previousReading,
          currentReading
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        acc,
        dueBill,
        prev,
        curr
      ]
    );

    alert('Saved');

    router.back();
  };

  return (
    <View style={{ padding: 20, gap: 10 }}>

      <TextInput
        placeholder="Account Number"
        value={acc}
        onChangeText={setAcc}
      />

      <TextInput
        placeholder="Due Bill"
        value={due}
        keyboardType="numeric"
        onChangeText={setDue}
      />

      <TextInput
        placeholder="Previous Reading"
        value={pre}
        keyboardType="numeric"
        onChangeText={setPre}
      />

      <TextInput
        placeholder="Current Reading"
        value={cur}
        keyboardType="numeric"
        onChangeText={setCur}
      />

      <Button
        title="Save"
        onPress={save}
      />

    </View>
  );
}