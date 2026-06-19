import { View, TextInput, Button } from 'react-native';
import { useEffect, useState } from 'react';
import db from '../database/db';
import { router, useLocalSearchParams } from 'expo-router';

export default function Edit() {

  const { id } = useLocalSearchParams();

  const [acc, setAcc] = useState('');
  const [due, setDue] = useState('');
  const [pre, setPre] = useState('');
  const [cur, setCur] = useState('');

  useEffect(() => {
    const data = db.getFirstSync(
      'SELECT * FROM bills WHERE id=?',
      [id]
    );

    setAcc(data.accNumber);
    setDue(String(data.dueBill));
    setPre(String(data.previousReading));
    setCur(String(data.currentReading));
  }, []);

  const update = () => {
    db.runSync(
      `UPDATE bills
       SET accNumber=?, dueBill=?, previousReading=?, currentReading=?
       WHERE id=?`,
      [acc, due, pre, cur, id]
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