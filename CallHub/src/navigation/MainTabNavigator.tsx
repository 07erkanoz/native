/**
 * LifeCall - Ana Tab Navigator
 *
 * 5 ana sekme:
 * - Favoriler
 * - Aramalar
 * - Kişiler
 * - Takvim
 * - Ayarlar
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../theme';
import { MainTabParamList } from './types';

// Placeholder ekranlar (gerçek ekranlar daha sonra oluşturulacak)
import FavoritesScreen from '../screens/FavoritesScreen';
import CallsScreen from '../screens/CallsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import NotesScreen from '../screens/NotesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icon bileşeni
interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
  name: string;
  focusedName?: string;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({
  focused,
  color,
  size,
  name,
  focusedName,
}) => {
  const iconName = focused ? focusedName || name : `${name}-outline`;
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
};

const MainTabNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.divider,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: t('tabs.favorites'),
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              name="star"
              focusedName="star"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Calls"
        component={CallsScreen}
        options={{
          tabBarLabel: t('tabs.calls'),
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              name="phone"
              focusedName="phone"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarLabel: t('tabs.contacts'),
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              name="account-group"
              focusedName="account-group"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: t('tabs.calendar'),
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              name="calendar"
              focusedName="calendar"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          tabBarLabel: t('tabs.notes'),
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              name="note-text"
              focusedName="note-text"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              name="cog"
              focusedName="cog"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
