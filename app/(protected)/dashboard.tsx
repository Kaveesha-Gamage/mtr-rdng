import { View, Text, Button } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

export default function Dashboard(){

  const {session,logout} = useAuth();

 return(
   <View>
    <>
      <Text>
        Welcome {session?.userName}
      </Text>
    </>

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