import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function Dashboard(){

 return(
   <View>

    <Text>
      Successfully loged in.
    </Text>

    <Button
      title="logout"
      onPress={() =>
        router.push("/")
      }
    />

   </View>
 )

}