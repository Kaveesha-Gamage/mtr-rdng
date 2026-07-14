import { 
  View, 
  Text, 
  Button 
} from "react-native";

import { downloadPendingReadings } from "../../../src/services/pendingService";


export default function PendingReadingsScreen(){


  const handleDownload = async()=>{

    try{

      const response =
        await downloadPendingReadings();


      console.log(
        "PENDING READINGS RESPONSE:",
        JSON.stringify(response,null,2)
      );


    }catch(error){

      console.log(
        "ERROR:",
        error
      );

    }

  };


  return(

    <View
      style={{
        flex:1,
        justifyContent:"center",
        alignItems:"center"
      }}
    >

      <Text>
        Pending Readings
      </Text>


      <Button
        title="Download Pending Readings"
        onPress={handleDownload}
      />


    </View>

  );

}