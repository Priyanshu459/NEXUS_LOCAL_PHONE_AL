import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { GalleryScreen } from './src/screens/GalleryScreen';
import { WorkspaceScreen } from './src/screens/WorkspaceScreen';

export type RootStackParamList = {
  Workspace: undefined;
  Gallery: undefined;
  Chat: { openModels?: boolean; initialPrompt?: string } | undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#131314" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Workspace"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: {
              backgroundColor: '#131314',
            },
          }}>
          <Stack.Screen name="Workspace" component={WorkspaceScreen} />
          <Stack.Screen name="Gallery" component={GalleryScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
