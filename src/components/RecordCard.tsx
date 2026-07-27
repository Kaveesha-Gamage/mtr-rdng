import { Button, Text, View } from "react-native";

import db from "../database/db";

export default function RecordCard({ record, navigation }: any) {
  const deleteRecord = () => {
    db.runSync("DELETE FROM bills WHERE id=?", [record.id]);

    navigation.goBack();
  };

  return (
    <View
      style={{
        padding: 15,
        marginVertical: 10,
        borderWidth: 1,
      }}
    >
      <Text>
        Acc:
        {record.accNumber}
      </Text>

      <Text>
        Due:
        {record.dueBill}
      </Text>

      <Text>
        Previous:
        {record.previousReading}
      </Text>

      <Text>
        Current:
        {record.currentReading}
      </Text>

      <Button
        title="Edit"
        onPress={() => navigation.navigate("Edit", record)}
      />

      <Button title="Delete" onPress={deleteRecord} />
    </View>
  );
}
