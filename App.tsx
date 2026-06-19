import { NavigationContainer } from '@react-navigation/native';
import {
createNativeStackNavigator
} from '@react-navigation/native-stack';

import HomeScreen from './app/HomeScreen';
import AddRecord from './app/AddRecord';
import EditRecord from './app/EditRecord';

import { useEffect } from 'react';
import { initDatabase } from './database/db';

const Stack=createNativeStackNavigator();

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

</Stack.Navigator>

</NavigationContainer>
);

}