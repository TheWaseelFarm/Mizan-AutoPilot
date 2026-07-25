import { DefaultTheme, NavigationContainer, type LinkingOptions, type Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootTabs } from './src/navigation/RootTabs';
import type { TabParamList } from './src/navigation/types';
import { I18nProvider } from './src/i18n';
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

/**
 * Stable, shareable per-route URLs + deep-link/refresh support (handoff: "Direct routes and
 * browser refresh must work in production"). Paired with the SPA rewrite in vercel.json so a
 * cold hit on /stock/XOM serves the app shell, then this config resolves the screen.
 */
const webOrigin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined;

const linking: LinkingOptions<TabParamList> = {
  // Web resolves against the deployed origin; native uses the app scheme (app.json: "mizan").
  prefixes: [webOrigin, 'mizan://'].filter(Boolean) as string[],
  config: {
    screens: {
      HomeTab: { screens: { Home: 'portfolios', PortfolioDetail: 'portfolio/:name' } },
      StocksTab: { screens: { Stocks: 'stocks', StockDetail: 'stock/:ticker' } },
      FollowingTab: 'following',
      AlertsTab: 'alerts',
      ProfileTab: 'account',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <FeedProvider>
          <FollowsProvider>
            <PreferencesProvider>
              <NavigationContainer theme={navTheme} linking={linking}>
                <StatusBar style="dark" />
                <RootTabs />
              </NavigationContainer>
            </PreferencesProvider>
          </FollowsProvider>
        </FeedProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
