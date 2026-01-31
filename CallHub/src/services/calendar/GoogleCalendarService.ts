/**
 * LifeCall - Google Calendar Senkronizasyon Servisi
 *
 * Google Calendar API ile etkinlik senkronizasyonu.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent, Calendar, GoogleAccountInfo, EventReminder, EventRecurrence } from '../../types/calendar';

// Storage keys
const GOOGLE_AUTH_KEY = '@lifecall_google_auth';
const GOOGLE_CALENDARS_KEY = '@lifecall_google_calendars';
const LAST_SYNC_KEY = '@lifecall_last_sync';

// Google API endpoints
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// Google API scopes
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Google Calendar event formatı
 */
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
  colorId?: string;
  status?: string;
  created?: string;
  updated?: string;
}

/**
 * Google Calendar listesi formatı
 */
interface GoogleCalendarList {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  accessRole?: string;
}

/**
 * Google Calendar Servisi
 */
class GoogleCalendarService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.loadStoredAuth();
  }

  /**
   * Kayıtlı auth bilgilerini yükle
   */
  private async loadStoredAuth(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(GOOGLE_AUTH_KEY);
      if (stored) {
        const auth = JSON.parse(stored);
        this.accessToken = auth.accessToken;
        this.refreshToken = auth.refreshToken;
        this.tokenExpiry = auth.tokenExpiry;
      }
    } catch (error) {
      console.error('loadStoredAuth error:', error);
    }
  }

  /**
   * Auth bilgilerini kaydet
   */
  private async saveAuth(auth: GoogleAccountInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(GOOGLE_AUTH_KEY, JSON.stringify({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        tokenExpiry: auth.tokenExpiry,
      }));
      this.accessToken = auth.accessToken || null;
      this.refreshToken = auth.refreshToken || null;
      this.tokenExpiry = auth.tokenExpiry || null;
    } catch (error) {
      console.error('saveAuth error:', error);
    }
  }

  /**
   * Google hesabı bağlı mı kontrol et
   */
  async isConnected(): Promise<boolean> {
    await this.loadStoredAuth();
    return !!this.accessToken && !!this.tokenExpiry && this.tokenExpiry > Date.now();
  }

  /**
   * Google hesap bilgilerini al
   */
  async getAccountInfo(): Promise<GoogleAccountInfo | null> {
    try {
      const stored = await AsyncStorage.getItem(GOOGLE_AUTH_KEY);
      if (!stored) return null;

      return JSON.parse(stored);
    } catch (error) {
      console.error('getAccountInfo error:', error);
      return null;
    }
  }

  /**
   * Google Sign-In ile bağlan
   * Not: Bu fonksiyon @react-native-google-signin/google-signin paketini kullanır
   */
  async signIn(userInfo: any, tokens: { accessToken: string; idToken?: string }): Promise<GoogleAccountInfo> {
    const accountInfo: GoogleAccountInfo = {
      email: userInfo.user?.email || '',
      displayName: userInfo.user?.name || userInfo.user?.givenName || '',
      photoUrl: userInfo.user?.photo || undefined,
      isConnected: true,
      accessToken: tokens.accessToken,
      tokenExpiry: Date.now() + 3600 * 1000, // 1 saat
    };

    await this.saveAuth(accountInfo);
    return accountInfo;
  }

  /**
   * Çıkış yap
   */
  async signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GOOGLE_AUTH_KEY);
      await AsyncStorage.removeItem(GOOGLE_CALENDARS_KEY);
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
    } catch (error) {
      console.error('signOut error:', error);
    }
  }

  /**
   * API isteği yap
   */
  private async apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Google hesabı bağlı değil');
    }

    const url = `${GOOGLE_CALENDAR_API}${endpoint}`;
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || 'API hatası');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Takvim listesini al
   */
  async getCalendarList(): Promise<Calendar[]> {
    try {
      const response = await this.apiRequest<{ items: GoogleCalendarList[] }>('/users/me/calendarList');

      const calendars: Calendar[] = (response.items || []).map(item => ({
        id: `google_${item.id}`,
        name: item.summary,
        color: item.backgroundColor || '#4285F4',
        isLocal: false,
        isGoogleCalendar: true,
        googleCalendarId: item.id,
        isVisible: true,
        isPrimary: item.primary || false,
        isReadOnly: item.accessRole === 'reader',
      }));

      // Kaydet
      await AsyncStorage.setItem(GOOGLE_CALENDARS_KEY, JSON.stringify(calendars));

      return calendars;
    } catch (error) {
      console.error('getCalendarList error:', error);
      throw error;
    }
  }

  /**
   * Etkinlikleri al
   */
  async getEvents(
    calendarId: string,
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 250
  ): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      if (timeMin) {
        params.append('timeMin', timeMin.toISOString());
      }
      if (timeMax) {
        params.append('timeMax', timeMax.toISOString());
      }

      const response = await this.apiRequest<{ items: GoogleCalendarEvent[] }>(
        `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
      );

      return (response.items || []).map(item => this.convertToCalendarEvent(item, calendarId));
    } catch (error) {
      console.error('getEvents error:', error);
      throw error;
    }
  }

  /**
   * Etkinlik oluştur
   */
  async createEvent(calendarId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const googleEvent = this.convertToGoogleEvent(event);

      const response = await this.apiRequest<GoogleCalendarEvent>(
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        'POST',
        googleEvent
      );

      return this.convertToCalendarEvent(response, calendarId);
    } catch (error) {
      console.error('createEvent error:', error);
      throw error;
    }
  }

  /**
   * Etkinlik güncelle
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    try {
      const googleEvent = this.convertToGoogleEvent(updates);

      const response = await this.apiRequest<GoogleCalendarEvent>(
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        'PATCH',
        googleEvent
      );

      return this.convertToCalendarEvent(response, calendarId);
    } catch (error) {
      console.error('updateEvent error:', error);
      throw error;
    }
  }

  /**
   * Etkinlik sil
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      await this.apiRequest(
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        'DELETE'
      );
    } catch (error) {
      console.error('deleteEvent error:', error);
      throw error;
    }
  }

  /**
   * Tüm takvimleri senkronize et
   */
  async syncAll(
    localEvents: CalendarEvent[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    added: CalendarEvent[];
    updated: CalendarEvent[];
    deleted: string[];
    errors: string[];
  }> {
    const result = {
      added: [] as CalendarEvent[],
      updated: [] as CalendarEvent[],
      deleted: [] as string[],
      errors: [] as string[],
    };

    try {
      // Takvim listesini al
      const calendars = await this.getCalendarList();

      // Son 1 ay ve gelecek 6 ay için senkronize et
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1);
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 6);

      let totalCalendars = calendars.length;
      let currentCalendar = 0;

      for (const calendar of calendars) {
        if (!calendar.googleCalendarId) continue;

        try {
          currentCalendar++;
          onProgress?.(currentCalendar, totalCalendars);

          // Google'dan etkinlikleri al
          const googleEvents = await this.getEvents(
            calendar.googleCalendarId,
            timeMin,
            timeMax
          );

          // Yeni etkinlikleri bul
          for (const googleEvent of googleEvents) {
            const existingEvent = localEvents.find(
              e => e.googleEventId === googleEvent.googleEventId
            );

            if (!existingEvent) {
              result.added.push(googleEvent);
            } else {
              // Güncelleme kontrolü (updatedAt karşılaştırması)
              const googleUpdated = new Date(googleEvent.updatedAt).getTime();
              const localUpdated = new Date(existingEvent.updatedAt).getTime();

              if (googleUpdated > localUpdated) {
                result.updated.push({
                  ...googleEvent,
                  id: existingEvent.id, // Yerel ID'yi koru
                });
              }
            }
          }

          // Silinen etkinlikleri bul
          const googleEventIds = googleEvents.map(e => e.googleEventId);
          const deletedEvents = localEvents.filter(
            e => e.googleCalendarId === calendar.googleCalendarId &&
                 e.googleEventId &&
                 !googleEventIds.includes(e.googleEventId)
          );

          for (const deleted of deletedEvents) {
            result.deleted.push(deleted.id);
          }
        } catch (error: any) {
          result.errors.push(`${calendar.name}: ${error.message}`);
        }
      }

      // Son senkronizasyon zamanını kaydet
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (error: any) {
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Son senkronizasyon zamanını al
   */
  async getLastSyncTime(): Promise<number | null> {
    try {
      const stored = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Google etkinliğini CalendarEvent'e dönüştür
   */
  private convertToCalendarEvent(googleEvent: GoogleCalendarEvent, calendarId: string): CalendarEvent {
    const isAllDay = !googleEvent.start.dateTime;

    const startDate = isAllDay
      ? googleEvent.start.date!
      : googleEvent.start.dateTime!;

    const endDate = isAllDay
      ? googleEvent.end.date!
      : googleEvent.end.dateTime!;

    // Hatırlatıcıları dönüştür
    const reminders: EventReminder[] = [];
    if (googleEvent.reminders?.overrides) {
      googleEvent.reminders.overrides.forEach((override, index) => {
        reminders.push({
          id: `${googleEvent.id}_reminder_${index}`,
          minutes: override.minutes,
          type: override.method === 'email' ? 'email' : 'notification',
        });
      });
    }

    return {
      id: `google_${googleEvent.id}`,
      title: googleEvent.summary || 'Başlıksız Etkinlik',
      description: googleEvent.description,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      allDay: isAllDay,
      location: googleEvent.location ? {
        address: googleEvent.location,
      } : undefined,
      reminders,
      color: this.colorIdToEventColor(googleEvent.colorId),
      calendarId: `google_${calendarId}`,
      isGoogleEvent: true,
      googleEventId: googleEvent.id,
      googleCalendarId: calendarId,
      status: (googleEvent.status as any) || 'confirmed',
      createdAt: googleEvent.created || new Date().toISOString(),
      updatedAt: googleEvent.updated || new Date().toISOString(),
    };
  }

  /**
   * CalendarEvent'i Google formatına dönüştür
   */
  private convertToGoogleEvent(event: Partial<CalendarEvent>): Partial<GoogleCalendarEvent> {
    const googleEvent: Partial<GoogleCalendarEvent> = {};

    if (event.title) {
      googleEvent.summary = event.title;
    }

    if (event.description !== undefined) {
      googleEvent.description = event.description;
    }

    if (event.location?.address) {
      googleEvent.location = event.location.address;
    }

    if (event.startDate) {
      if (event.allDay) {
        googleEvent.start = {
          date: event.startDate.split('T')[0],
        };
      } else {
        googleEvent.start = {
          dateTime: event.startDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
    }

    if (event.endDate) {
      if (event.allDay) {
        googleEvent.end = {
          date: event.endDate.split('T')[0],
        };
      } else {
        googleEvent.end = {
          dateTime: event.endDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
    }

    if (event.reminders && event.reminders.length > 0) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: event.reminders.map(r => ({
          method: r.type === 'email' ? 'email' : 'popup',
          minutes: r.minutes,
        })),
      };
    }

    if (event.color) {
      googleEvent.colorId = this.eventColorToColorId(event.color);
    }

    return googleEvent;
  }

  /**
   * Google colorId'yi EventColor'a dönüştür
   */
  private colorIdToEventColor(colorId?: string): any {
    const colorMap: Record<string, string> = {
      '1': 'blue',
      '2': 'green',
      '3': 'purple',
      '4': 'red',
      '5': 'yellow',
      '6': 'orange',
      '7': 'teal',
      '8': 'gray',
      '9': 'indigo',
      '10': 'green',
      '11': 'pink',
    };
    return colorMap[colorId || '1'] || 'blue';
  }

  /**
   * EventColor'ı Google colorId'ye dönüştür
   */
  private eventColorToColorId(color: any): string {
    const colorMap: Record<string, string> = {
      'blue': '1',
      'green': '2',
      'purple': '3',
      'red': '4',
      'yellow': '5',
      'orange': '6',
      'teal': '7',
      'gray': '8',
      'indigo': '9',
      'pink': '11',
    };
    return colorMap[color] || '1';
  }
}

export const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;
