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
import EventEditScreen from '../screens/EventEditScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import NoteEditScreen from '../screens/NoteEditScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import SettingsAppearanceScreen from '../screens/settings/SettingsAppearanceScreen';
import SettingsLanguageScreen from '../screens/settings/SettingsLanguageScreen';
import SettingsCalendarScreen from '../screens/settings/SettingsCalendarScreen';
import SettingsAboutScreen from '../screens/settings/SettingsAboutScreen';
import SettingsCallThemeScreen from '../screens/settings/SettingsCallThemeScreen';
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

      <Stack.Screen
        name="SettingsCallTheme"
        component={SettingsCallThemeScreen}
        options={{
          title: t('callThemes.title') || 'Arama Teması',
        }}
      />

      {/* Takvim Ekranları */}
      <Stack.Screen
        name="EventEdit"
        component={EventEditScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          title: '',
          headerTransparent: true,
        }}
      />

      {/* Takvim Ayarları */}
      <Stack.Screen
        name="SettingsCalendar"
        component={SettingsCalendarScreen}
        options={{
          title: t('settings.calendar.title'),
        }}
      />

      {/* Not Ekranları */}
      <Stack.Screen
        name="NoteEdit"
        component={NoteEditScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Hakkında */}
      <Stack.Screen
        name="SettingsAbout"
        component={SettingsAboutScreen}
        options={{
          title: t('settings.about.title'),
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
