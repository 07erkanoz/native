/**
 * LifeCall - Navigation Tip Tanımları
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Bottom Tab Navigator parametreleri
export type MainTabParamList = {
  Favorites: undefined;
  Calls: undefined;
  Contacts: undefined;
  Calendar: undefined;
  Settings: undefined;
};

// Root Stack Navigator parametreleri
export type RootStackParamList = {
  // Ana tab navigator
  Main: NavigatorScreenParams<MainTabParamList>;

  // Kişi ekranları
  ContactDetail: { contactId: string };
  ContactEdit: { contactId?: string; accountId?: string };
  ContactAdd: { accountId?: string };

  // Arama ekranları
  CallDetail: { callId: string };
  IncomingCall: { callId: string };
  OngoingCall: { callId: string };

  // Takvim ekranları
  EventDetail: { eventId: string };
  EventEdit: { eventId?: string };

  // Notlar
  NoteDetail: { noteId: string };
  NoteEdit: { noteId?: string; callId?: string };

  // Mağaza
  ThemeStore: undefined;
  ThemePreview: { themeId: string };
  RingtoneStore: undefined;
  RingtonePreview: { ringtoneId: string };

  // Ayarlar alt ekranları
  SettingsAppearance: undefined;
  SettingsContacts: undefined;
  SettingsCalls: undefined;
  SettingsNotifications: undefined;
  SettingsPrivacy: undefined;
  SettingsBackup: undefined;
  SettingsAbout: undefined;
  SettingsLanguage: undefined;
  BlockedNumbers: undefined;

  // Dialer
  Dialer: undefined;

  // Arama
  Search: undefined;

  // Kurulum
  SetupWizard: undefined;
};

// Screen props type helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

// Global navigation tipi
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
