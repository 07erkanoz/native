/**
 * LifeCall - Root Navigator
 *
 * Ana stack navigator - tüm ekranları barındırır
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../theme';
import { RootStackParamList } from './types';

// Navigators
import MainTabNavigator from './MainTabNavigator';

// Screens
import ContactDetailScreen from '../screens/ContactDetailScreen';
import ContactEditScreen from '../screens/ContactEditScreen';
import CallDetailScreen from '../screens/CallDetailScreen';
import IncomingCallScreen from '../screens/IncomingCallScreen';
import OngoingCallScreen from '../screens/OngoingCallScreen';
import SearchScreen from '../screens/SearchScreen';
import DialerScreen from '../screens/DialerScreen';
import SetupWizardScreen from '../screens/SetupWizardScreen';
import SettingsAppearanceScreen from '../screens/settings/SettingsAppearanceScreen';
import SettingsLanguageScreen from '../screens/settings/SettingsLanguageScreen';
import ThemeStoreScreen from '../screens/store/ThemeStoreScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.header,
        },
        headerTintColor: theme.colors.headerText,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      {/* Ana Tab Navigator */}
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />

      {/* Kişi Ekranları */}
      <Stack.Screen
        name="ContactDetail"
        component={ContactDetailScreen}
        options={{
          title: '', // Kişi adı dinamik olarak ayarlanacak
          headerTransparent: true,
        }}
      />

      <Stack.Screen
        name="ContactEdit"
        component={ContactEditScreen}
        options={({ route }) => ({
          title: route.params?.contactId
            ? t('contacts.editContact')
            : t('contacts.newContact'),
          presentation: 'modal',
        })}
      />

      <Stack.Screen
        name="ContactAdd"
        component={ContactEditScreen}
        options={{
          title: t('contacts.newContact'),
          presentation: 'modal',
        }}
      />

      {/* Arama Ekranları */}
      <Stack.Screen
        name="CallDetail"
        component={CallDetailScreen}
        options={{
          title: t('calls.history'),
        }}
      />

      <Stack.Screen
        name="IncomingCall"
        component={IncomingCallScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />

      <Stack.Screen
        name="OngoingCall"
        component={OngoingCallScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />

      {/* Arama */}
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />

      {/* Dialer */}
      <Stack.Screen
        name="Dialer"
        component={DialerScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      {/* Ayarlar Alt Ekranları */}
      <Stack.Screen
        name="SettingsAppearance"
        component={SettingsAppearanceScreen}
        options={{
          title: t('settings.appearance.title'),
        }}
      />

      <Stack.Screen
        name="SettingsLanguage"
        component={SettingsLanguageScreen}
        options={{
          title: t('settings.appearance.language'),
        }}
      />

      {/* Mağaza */}
      <Stack.Screen
        name="ThemeStore"
        component={ThemeStoreScreen}
        options={{
          title: t('store.themes'),
        }}
      />

      {/* Kurulum Sihirbazı */}
      <Stack.Screen
        name="SetupWizard"
        component={SetupWizardScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
