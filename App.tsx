import React, { useCallback, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { GalleryScreen } from './src/screens/GalleryScreen';
import { WorkspaceScreen } from './src/screens/WorkspaceScreen';
import { ModelsScreen } from './src/screens/ModelsScreen';
import MoonlightSplash from './src/components/MoonlightSplash';
import { MoonDock } from './src/components/MoonDock';

export type RootStackParamList = {
  MainTabs: undefined;
  Chat: { openModels?: boolean; initialPrompt?: string } | undefined;
  Settings: undefined;
  Gallery: undefined; // fallback if directly routed
};

export type MainTabParamList = {
  Home: undefined;
  Prompts: undefined;
  Models: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <MoonDock {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={WorkspaceScreen} />
      <Tab.Screen name="Prompts" component={GalleryScreen} />
      <Tab.Screen name="Models" component={ModelsScreen} />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  if (!splashDone) {
    return <MoonlightSplash onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#131314" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="MainTabs"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: {
              backgroundColor: '#131314',
            },
          }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Gallery" component={GalleryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
