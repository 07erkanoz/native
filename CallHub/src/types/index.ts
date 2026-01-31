/**
 * CallHub - Ana Tip Tanımları
 * @format
 */

// Hesap tipleri
export type AccountType =
  | 'google'
  | 'samsung'
  | 'phone'
  | 'whatsapp'
  | 'telegram'
  | 'microsoft'
  | 'other';

// Cihaz hesabı
export interface DeviceAccount {
  id: string;
  type: AccountType;
  name: string;
  displayName: string;
  icon: string;
  contactCount: number;
  isVisible: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Telefon numarası
export interface PhoneNumber {
  id: string;
  number: string;
  formattedNumber: string;
  label: PhoneLabel;
  customLabel?: string;
  isPrimary: boolean;
}

export type PhoneLabel =
  | 'mobile'
  | 'home'
  | 'work'
  | 'main'
  | 'fax_work'
  | 'fax_home'
  | 'pager'
  | 'other'
  | 'custom';

// E-posta adresi
export interface EmailAddress {
  id: string;
  email: string;
  label: EmailLabel;
  customLabel?: string;
  isPrimary: boolean;
}

export type EmailLabel = 'personal' | 'work' | 'other' | 'custom';

// Adres
export interface PostalAddress {
  id: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  formattedAddress: string;
  label: AddressLabel;
  customLabel?: string;
}

export type AddressLabel = 'home' | 'work' | 'other' | 'custom';

// İlişki
export interface Relation {
  id: string;
  name: string;
  contactId?: string;
  type: RelationType;
  customType?: string;
}

export type RelationType =
  | 'spouse'
  | 'child'
  | 'mother'
  | 'father'
  | 'sibling'
  | 'assistant'
  | 'partner'
  | 'manager'
  | 'other'
  | 'custom';

// Önemli tarih
export interface ImportantDate {
  id: string;
  date: string; // ISO 8601
  label: DateLabel;
  customLabel?: string;
}

export type DateLabel = 'birthday' | 'anniversary' | 'other' | 'custom';

// Sosyal profil
export interface SocialProfile {
  id: string;
  service: SocialService;
  username: string;
  url?: string;
}

export type SocialService =
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'other';

// Web sitesi
export interface Website {
  id: string;
  url: string;
  label: WebsiteLabel;
  customLabel?: string;
}

export type WebsiteLabel = 'homepage' | 'blog' | 'work' | 'other' | 'custom';

// Fotoğraf kaynağı
export type PhotoSource = 'device' | 'custom' | 'google' | 'gravatar' | 'avatar';

// Kişi (kapsamlı)
export interface Contact {
  // Tanımlayıcı
  id: string;
  rawContactId: string;
  accountType: AccountType;
  accountName: string;

  // İsim bilgileri
  displayName: string;
  givenName?: string;
  middleName?: string;
  familyName?: string;
  prefix?: string;
  suffix?: string;
  phoneticGivenName?: string;
  phoneticFamilyName?: string;
  nickname?: string;

  // Fotoğraf
  thumbnailPath?: string;
  photoUri?: string;
  hasPhoto: boolean;
  photoSource: PhotoSource;

  // İletişim bilgileri
  phoneNumbers: PhoneNumber[];
  emailAddresses: EmailAddress[];

  // Kuruluş
  company?: string;
  department?: string;
  jobTitle?: string;

  // Adresler
  postalAddresses: PostalAddress[];

  // Önemli tarihler
  birthday?: string;
  anniversary?: string;
  importantDates: ImportantDate[];

  // Web & Sosyal
  websites: Website[];
  socialProfiles: SocialProfile[];

  // İlişkiler
  relations: Relation[];

  // Gruplar
  groups: string[];

  // Notlar
  note?: string;

  // Özel ayarlar
  customRingtone?: string;
  isFavorite: boolean;
  isBlocked: boolean;

  // Meta
  createdAt: string;
  updatedAt: string;
}

// Arama türü
export type CallType =
  | 'incoming'
  | 'outgoing'
  | 'missed'
  | 'rejected'
  | 'blocked';

// Arama kategorisi
export type CallCategory = 'voice' | 'video';

// Arama kaydı
export interface CallLogEntry {
  id: string;
  contactId?: string;
  phoneNumber: string;
  formattedNumber: string;
  contactName?: string;
  contactPhoto?: string;
  callType: CallType;
  callCategory: CallCategory;
  duration: number;
  callDate: string;
  callTime: string;
  isRead: boolean;
  isNew: boolean;
  simSlot?: number;
  geocodedLocation?: string;
  networkType?: string;
  hasNote: boolean;
  noteId?: string;
}

// Favori kişi
export interface FavoriteContact {
  id: string;
  contactId: string;
  displayName: string;
  photoUri?: string;
  phoneNumber: string;
  sortOrder: number;
  addedAt: string;
}

// Tema
export type ThemeMode = 'light' | 'dark' | 'system';

// Dil kodu
export type LanguageCode = 'tr' | 'en' | 'de' | 'fr' | 'es' | 'ar' | 'ru';

// Uygulama ayarları
export interface AppSettings {
  theme: ThemeMode;
  language: LanguageCode;
  fontSize: number;
  hapticFeedback: boolean;
}

// Navigation param listesi
export type RootStackParamList = {
  Main: undefined;
  ContactDetail: { contactId: string };
  ContactEdit: { contactId?: string; accountId?: string };
  CallDetail: { callId: string };
  Settings: undefined;
  ThemeStore: undefined;
  RingtoneStore: undefined;
};

export type MainTabParamList = {
  Favorites: undefined;
  CallHistory: undefined;
  Contacts: undefined;
  Calendar: undefined;
  Settings: undefined;
};

// Takvim tipleri
export * from './calendar';

// Not tipleri
export * from './notes';
