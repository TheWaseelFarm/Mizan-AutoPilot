import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon, type IconName } from '../components/Icon';
import { AlertsScreen } from '../screens/AlertsScreen';
import { FollowingScreen } from '../screens/FollowingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PortfolioDetailScreen } from '../screens/PortfolioDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StockDetailScreen } from '../screens/StockDetailScreen';
import { StocksScreen } from '../screens/StocksScreen';
import { useFeed } from '../state/feed';
import { useFollows } from '../state/follows';
import { color, font, layout } from '../theme/tokens';
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

/** An explicit, always-visible back chevron for detail screens (professional icon, no glyph). */
function HeaderBack({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 16 }}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={{ paddingRight: 8 }}
    >
      <Icon name="chevronLeft" size={26} color={color.ink} strokeWidth={2} />
    </TouchableOpacity>
  );
}

// Detail screens: explicit ‹ back button (not just the platform default) + swipe-back gesture.
// The list screen underneath stays mounted, so its scroll position is preserved on return.
const detailOptions = (title: string) => ({ navigation }: { navigation: { goBack: () => void; canGoBack: () => boolean } }) => ({
  title,
  gestureEnabled: true,
  headerBackVisible: false,
  headerLeft: () => (navigation.canGoBack() ? <HeaderBack onPress={() => navigation.goBack()} /> : null),
});

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen
        name="PortfolioDetail"
        component={PortfolioDetailScreen}
        options={detailOptions('Portfolio')}
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
        options={detailOptions('Stock')}
      />
    </StocksStack.Navigator>
  );
}

/** A professional SVG tab-bar icon. */
function tabIcon(name: IconName) {
  return ({ color: c, focused }: { color: string; focused: boolean }) => (
    <Icon name={name} size={22} color={c} strokeWidth={focused ? 2 : 1.75} />
  );
}

export function RootTabs() {
  // In-app Alerts badge: disclosures from the portfolios the user follows (spec §4).
  const { rows } = useFeed();
  const { followed } = useFollows();
  const alerts = followed.length ? rows.filter((r) => followed.includes(r.actor)).length : 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.faint,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.line,
          height: layout.mobileNavHeight,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: font.tiny, fontWeight: font.weight.bold as '700' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNav}
        options={{ title: 'Portfolios', tabBarIcon: tabIcon('portfolios') }}
      />
      <Tab.Screen
        name="StocksTab"
        component={StocksStackNav}
        options={{ title: 'Stocks', tabBarIcon: tabIcon('stocks') }}
      />
      <Tab.Screen
        name="FollowingTab"
        component={FollowingScreen}
        options={{ title: 'Following', tabBarIcon: tabIcon('star') }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: tabIcon('bell'),
          tabBarBadge: alerts || undefined,
          tabBarBadgeStyle: { backgroundColor: color.brand, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Account', tabBarIcon: tabIcon('user') }}
      />
    </Tab.Navigator>
  );
}
