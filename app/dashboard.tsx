import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Dashboard(){

 return(
   <View>

    <Text>
      Dashboard
    </Text>

    <Button
      title="Pending Readings"
      onPress={() =>
        router.push("/pending-readings")
      }
    />

   </View>
 )

}