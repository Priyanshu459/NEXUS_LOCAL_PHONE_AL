import React, { useCallback, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Theme, useAppearance, isDark } from './src/constants/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ChatScreen } from './src/screens/ChatScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import {ProvidersScreen} from './src/screens/ProvidersScreen';
import { GalleryScreen } from './src/screens/GalleryScreen';
import { WorkspaceScreen } from './src/screens/WorkspaceScreen';
import { ModelsScreen } from './src/screens/ModelsScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import { ModelAttributionScreen } from './src/screens/ModelAttributionScreen';
import MoonlightSplash from './src/components/MoonlightSplash';
import {AppUpdateNotice} from './src/components/AppUpdateNotice';
import {LMStudioScreen} from './src/screens/LMStudioScreen';


export type RootStackParamList = {
  Home: undefined;
  Tools: undefined;
  Models: undefined;
  Chat: { initialPrompt?: string; conversationId?: string; newConversation?: boolean; openHistory?: boolean } | undefined;
  Settings: undefined;
  Providers: undefined;
  LMStudio: undefined;
  PrivacyPolicy: undefined;
  ModelAttribution: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tools: undefined;
  Models: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
function App(): React.JSX.Element {
  useAppearance();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  if (!splashDone) {
    return <MoonlightSplash onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDark() ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <AppUpdateNotice />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Chat"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: {
              backgroundColor: Theme.color.background,
            },
          }}
        >
          <Stack.Screen name="Home" component={WorkspaceScreen} />
          <Stack.Screen name="Tools" component={GalleryScreen} />
          <Stack.Screen name="Models" component={ModelsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Providers" component={ProvidersScreen}/>
          <Stack.Screen name="LMStudio" component={LMStudioScreen}/>
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="ModelAttribution" component={ModelAttributionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
