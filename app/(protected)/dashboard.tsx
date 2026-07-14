import { View, Text, Button } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";


export default function Dashboard(){

  const {session, logout} = useAuth();


  return (

    <View
      style={{
        flex:1,
        justifyContent:"center",
        alignItems:"center"
      }}
    >

      <Text>
        Welcome {session?.userName}
      </Text>


      <Text>
        Successfully logged in.
      </Text>


      <Button
        title="Download Pending Readings"
        onPress={() =>
          router.push("/pending-readings")
        }
      />


      <Button
 title="logout"
 onPress={() =>
   router.push("/")
 }
/>

    </View>

  );
}