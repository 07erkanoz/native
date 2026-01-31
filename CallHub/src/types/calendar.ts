/**
 * LifeCall - Takvim Tipleri
 *
 * Takvim modülü için tip tanımları
 */

// ============================================
// ETKINLIK TIPLERI
// ============================================

/**
 * Etkinlik konumu
 */
export interface EventLocation {
  address: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  placeName?: string;
}

/**
 * Hatırlatıcı tipi
 */
export type ReminderType = 'notification' | 'alarm' | 'email';

/**
 * Etkinlik hatırlatıcısı
 */
export interface EventReminder {
  id: string;
  minutes: number;
  type: ReminderType;
  ringtoneUri?: string;
  vibrate?: boolean;
}

/**
 * Tekrar sıklığı
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Etkinlik tekrarı
 */
export interface EventRecurrence {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[]; // 0-6 (Pazar-Cumartesi)
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: string;
  count?: number;
}

/**
 * Etkinlik rengi
 */
export type EventColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'gray';

/**
 * Etkinlik durumu
 */
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

/**
 * Takvim etkinliği
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  allDay: boolean;
  location?: EventLocation;
  reminders: EventReminder[];
  recurrence?: EventRecurrence;
  color?: EventColor;
  calendarId: string;

  // İlişkiler
  contactIds?: string[];
  noteIds?: string[];

  // Google Calendar
  isGoogleEvent: boolean;
  googleEventId?: string;
  googleCalendarId?: string;

  // Meta
  status: EventStatus;
  createdAt: string;
  updatedAt: string;

  // Arama hatırlatıcısı
  isCallReminder?: boolean;
  callReminderPhoneNumber?: string;
}

// ============================================
// TAKVİM TIPLERI
// ============================================

/**
 * Takvim
 */
export interface Calendar {
  id: string;
  name: string;
  color: string;
  isLocal: boolean;
  isGoogleCalendar: boolean;
  googleCalendarId?: string;
  googleAccountEmail?: string;
  isVisible: boolean;
  isPrimary: boolean;
  isReadOnly?: boolean;
}

/**
 * Görünüm modu
 */
export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

/**
 * Haftanın ilk günü
 */
export type FirstDayOfWeek = 0 | 1 | 6; // Pazar, Pazartesi, Cumartesi

// ============================================
// AYARLAR
// ============================================

/**
 * Takvim ayarları
 */
export interface CalendarSettings {
  // Görünüm
  defaultView: CalendarViewMode;
  firstDayOfWeek: FirstDayOfWeek;
  showWeekNumbers: boolean;
  showDeclinedEvents: boolean;

  // Varsayılan değerler
  defaultReminderMinutes: number;
  defaultEventDuration: number; // dakika
  defaultCalendarId: string;
  defaultEventColor: EventColor;

  // Bildirimler
  notificationsEnabled: boolean;
  defaultRingtoneUri?: string;
  vibrateOnReminder: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string; // HH:mm

  // Senkronizasyon
  googleSyncEnabled: boolean;
  autoSyncInterval: number; // dakika (0 = manuel)
  syncOnlyOnWifi: boolean;
}

// ============================================
// SENKRONİZASYON
// ============================================

/**
 * Senkronizasyon durumu
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Senkronizasyon bilgisi
 */
export interface SyncInfo {
  status: SyncStatus;
  lastSyncTime?: number;
  lastSyncError?: string;
  pendingChanges: number;
}

/**
 * Google hesap bilgisi
 */
export interface GoogleAccountInfo {
  email: string;
  displayName?: string;
  photoUrl?: string;
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

// ============================================
// IMPORT/EXPORT
// ============================================

/**
 * Import dosya formatı
 */
export type ImportFormat = 'ics' | 'csv' | 'xlsx';

/**
 * Export dosya formatı
 */
export type ExportFormat = 'ics' | 'csv' | 'xlsx';

/**
 * Import sonucu
 */
export interface ImportResult {
  success: boolean;
  totalEvents: number;
  importedEvents: number;
  skippedEvents: number;
  errors: string[];
}

/**
 * Export seçenekleri
 */
export interface ExportOptions {
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
  calendarIds?: string[];
  includeReminders: boolean;
  includeRecurrence: boolean;
}

// ============================================
// REDUX STATE
// ============================================

/**
 * Takvim Redux state
 */
export interface CalendarState {
  // Veriler
  events: CalendarEvent[];
  calendars: Calendar[];

  // UI state
  selectedDate: string;
  viewMode: CalendarViewMode;
  selectedEventId: string | null;

  // Senkronizasyon
  syncInfo: SyncInfo;
  googleAccount: GoogleAccountInfo | null;

  // Ayarlar
  settings: CalendarSettings;

  // Loading states
  isLoading: boolean;
  isLoadingEvents: boolean;
  isSyncing: boolean;

  // Error
  error: string | null;
}

// ============================================
// ACTION PAYLOADS
// ============================================

/**
 * Etkinlik oluşturma payload
 */
export interface CreateEventPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  location?: EventLocation;
  reminders?: Omit<EventReminder, 'id'>[];
  recurrence?: EventRecurrence;
  color?: EventColor;
  calendarId?: string;
  contactIds?: string[];
  noteIds?: string[];
  isCallReminder?: boolean;
  callReminderPhoneNumber?: string;
}

/**
 * Etkinlik güncelleme payload
 */
export interface UpdateEventPayload {
  id: string;
  updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>;
}

/**
 * Tarih aralığı
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

// ============================================
// VARSAYILAN DEĞERLER
// ============================================

/**
 * Varsayılan takvim ayarları
 */
export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  defaultView: 'month',
  firstDayOfWeek: 1, // Pazartesi
  showWeekNumbers: false,
  showDeclinedEvents: false,
  defaultReminderMinutes: 30,
  defaultEventDuration: 60,
  defaultCalendarId: 'local',
  defaultEventColor: 'blue',
  notificationsEnabled: true,
  vibrateOnReminder: true,
  quietHoursEnabled: false,
  googleSyncEnabled: false,
  autoSyncInterval: 15,
  syncOnlyOnWifi: false,
};

/**
 * Varsayılan yerel takvim
 */
export const DEFAULT_LOCAL_CALENDAR: Calendar = {
  id: 'local',
  name: 'Yerel Takvim',
  color: '#6750A4',
  isLocal: true,
  isGoogleCalendar: false,
  isVisible: true,
  isPrimary: true,
};

/**
 * Hatırlatıcı süre seçenekleri (dakika)
 */
export const REMINDER_OPTIONS = [
  { label: '5 dakika önce', value: 5 },
  { label: '10 dakika önce', value: 10 },
  { label: '15 dakika önce', value: 15 },
  { label: '30 dakika önce', value: 30 },
  { label: '1 saat önce', value: 60 },
  { label: '2 saat önce', value: 120 },
  { label: '1 gün önce', value: 1440 },
  { label: '2 gün önce', value: 2880 },
  { label: '1 hafta önce', value: 10080 },
];

/**
 * Etkinlik renk seçenekleri
 */
export const EVENT_COLORS: Record<EventColor, string> = {
  red: '#F44336',
  orange: '#FF9800',
  yellow: '#FFEB3B',
  green: '#4CAF50',
  teal: '#009688',
  blue: '#2196F3',
  indigo: '#3F51B5',
  purple: '#9C27B0',
  pink: '#E91E63',
  gray: '#9E9E9E',
};
