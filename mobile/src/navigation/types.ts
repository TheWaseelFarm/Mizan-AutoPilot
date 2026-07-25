import type { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  PortfolioDetail: { name: string };
};

export type StocksStackParamList = {
  Stocks: undefined;
  StockDetail: { ticker: string };
};

export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  StocksTab: NavigatorScreenParams<StocksStackParamList>;
  FollowingTab: undefined;
  AlertsTab: undefined;
  ProfileTab: undefined;
};
