import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddRecord from './app/AddRecord';
import EditRecord from './app/EditRecord';
import HomeScreen from './app/HomeScreen';

import { useEffect } from 'react';
import { initDatabase } from './database/db';
import { exportDatabase } from './utils/exportDB';

const Stack=createNativeStackNavigator();

const ExportDatabaseScreen = () => {
  useEffect(() => {
    exportDatabase();
  }, []);

  return null;
};

export default function App(){

useEffect(()=>{
initDatabase();
},[]);

return(
<NavigationContainer>

<Stack.Navigator>

<Stack.Screen
name="Home"
component={HomeScreen}
/>

<Stack.Screen
name="Add"
component={AddRecord}
/>

<Stack.Screen
name="Edit"
component={EditRecord}
/>

<Stack.Screen
name="Export Database"
component={ExportDatabaseScreen}
/>

</Stack.Navigator>

</NavigationContainer>
);

}