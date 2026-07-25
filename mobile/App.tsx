import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootTabs } from './src/navigation/RootTabs';
import { FeedProvider } from './src/state/feed';
import { FollowsProvider } from './src/state/follows';
import { PreferencesProvider } from './src/state/preferences';
import { color } from './src/theme/tokens';

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: color.brand,
    background: color.bg,
    card: color.surface,
    text: color.ink,
    border: color.line,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <FeedProvider>
        <FollowsProvider>
          <PreferencesProvider>
            <NavigationContainer theme={navTheme}>
              <StatusBar style="dark" />
              <RootTabs />
            </NavigationContainer>
          </PreferencesProvider>
        </FollowsProvider>
      </FeedProvider>
    </SafeAreaProvider>
  );
}
