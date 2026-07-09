import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function LoginScreen() {

  return (
    <View>
      <Text>
        CEB Bulk Billing Login
      </Text>

      <Button
        title="Login"
        onPress={() => router.push("/dashboard")}
      />

    </View>
  );
}