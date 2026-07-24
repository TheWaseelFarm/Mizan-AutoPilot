import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text } from 'react-native';

import { FollowingScreen } from '../screens/FollowingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PortfolioDetailScreen } from '../screens/PortfolioDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StockDetailScreen } from '../screens/StockDetailScreen';
import { StocksScreen } from '../screens/StocksScreen';
import { useFeed } from '../state/feed';
import { useFollows } from '../state/follows';
import { color, font } from '../theme/tokens';
import type { HomeStackParamList, StocksStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const StocksStack = createNativeStackNavigator<StocksStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: color.bg },
  headerShadowVisible: false,
  headerTintColor: color.ink,
  headerTitleStyle: { fontWeight: font.weight.heavy as '800', color: color.ink },
  contentStyle: { backgroundColor: color.bg },
} as const;

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen
        name="PortfolioDetail"
        component={PortfolioDetailScreen}
        options={{ title: 'Portfolio' }}
      />
    </HomeStack.Navigator>
  );
}

function StocksStackNav() {
  return (
    <StocksStack.Navigator screenOptions={stackScreenOptions}>
      <StocksStack.Screen name="Stocks" component={StocksScreen} options={{ headerShown: false }} />
      <StocksStack.Screen
        name="StockDetail"
        component={StockDetailScreen}
        options={{ title: 'Stock' }}
      />
    </StocksStack.Navigator>
  );
}

/** A tiny glyph tab icon — no external icon lib needed for the scaffold. */
function tabIcon(glyph: string) {
  return ({ color: c, focused }: { color: string; focused: boolean }) => (
    <Text style={{ fontSize: 18, color: c, opacity: focused ? 1 : 0.7 }}>{glyph}</Text>
  );
}

export function RootTabs() {
  // In-app Alerts badge: disclosures from the portfolios the user follows (spec §4 Tab 3).
  const { rows } = useFeed();
  const { followed } = useFollows();
  const alerts = followed.length ? rows.filter((r) => followed.includes(r.actor)).length : 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.faint,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.line },
        tabBarLabelStyle: { fontSize: font.tiny, fontWeight: font.weight.medium as '600' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNav}
        options={{ title: 'Home', tabBarIcon: tabIcon('◈') }}
      />
      <Tab.Screen
        name="StocksTab"
        component={StocksStackNav}
        options={{ title: 'Stocks', tabBarIcon: tabIcon('◎') }}
      />
      <Tab.Screen
        name="FollowingTab"
        component={FollowingScreen}
        options={{
          title: 'Following',
          tabBarIcon: tabIcon('★'),
          tabBarBadge: alerts || undefined,
          tabBarBadgeStyle: { backgroundColor: color.brand, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: tabIcon('☰') }}
      />
    </Tab.Navigator>
  );
}
