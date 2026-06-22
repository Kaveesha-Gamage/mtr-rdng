import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, TextInput, View } from 'react-native';
import db from '../database/db';

type BillRecord = {
  accNumber: string;
  dueBill: number;
  previousReading: number;
  currentReading: number;
};

export default function Edit() {

  const { id } = useLocalSearchParams();
  const recordId = Array.isArray(id) ? id[0] : id;

  const [acc, setAcc] = useState('');
  const [due, setDue] = useState('');
  const [pre, setPre] = useState('');
  const [cur, setCur] = useState('');

  useEffect(() => {
    if (!recordId) {
      return;
    }

    const data = db.getFirstSync(
      'SELECT * FROM bills WHERE id=?',
      [recordId]
    ) as BillRecord | undefined;

    if (!data) {
      return;
    }

    setAcc(data.accNumber);
    setDue(String(data.dueBill));
    setPre(String(data.previousReading));
    setCur(String(data.currentReading));
  }, [recordId]);

  const update = () => {

    if (!recordId) {
      return;
    }

    const account = acc.trim();

    const dueBill = Number(due);
    const prev = Number(pre);
    const curr = Number(cur);

    // Required fields
    if (
      !account ||
      due.trim() === '' ||
      pre.trim() === '' ||
      cur.trim() === ''
    ) {
      alert('All fields are required');
      return;
    }

    // Numeric validation
    if (
      Number.isNaN(dueBill) ||
      Number.isNaN(prev) ||
      Number.isNaN(curr)
    ) {
      alert('Due bill and readings must be valid numbers');
      return;
    }

    // Positive validation
    if (prev <= 0 || curr <= 0) {
      alert('Readings must be greater than 0');
      return;
    }

    // Business rule
    if (curr < prev) {
      alert(
        'Current reading must be greater than or equal to previous reading'
      );
      return;
    }

    db.runSync(
      `
      UPDATE bills
      SET
        accNumber=?,
        dueBill=?,
        previousReading=?,
        currentReading=?
      WHERE id=?
      `,
      [
        account,
        dueBill,
        prev,
        curr,
        recordId
      ]
    );

    router.back();
};

  return (
    <View style={{ padding: 20 }}>

      <TextInput value={acc} onChangeText={setAcc} />
      <TextInput value={due} onChangeText={setDue} />
      <TextInput value={pre} onChangeText={setPre} />
      <TextInput value={cur} onChangeText={setCur} />

      <Button title="Update" onPress={update} />

    </View>
  );
}