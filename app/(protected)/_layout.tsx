import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";


export default function ProtectedLayout(){

  const {session,loading} = useAuth();

  if(loading){
    return null;
  }

  if(!session){
    return <Redirect href = "../" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown:true
      }}
    />
  );
}