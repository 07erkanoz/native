/**
 * LifeCall - Widget Modülü (TypeScript)
 *
 * Native Android widget'larını React Native'den kontrol eder.
 */

import { NativeModules, Platform } from 'react-native';
import { CalendarEvent } from '../types/calendar';

const { WidgetModule } = NativeModules;

/**
 * Son arama widget verisi
 */
export interface RecentCallData {
  name: string;
  phoneNumber: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
}

/**
 * Favori kişi widget verisi
 */
export interface FavoriteContactData {
  id: string;
  name: string;
  phoneNumber: string;
  photoUri?: string;
}

/**
 * Widget Servisi
 */
class WidgetService {
  private isAndroid = Platform.OS === 'android';

  /**
   * Takvim widget'ını güncelle
   */
  async updateCalendarWidget(events: CalendarEvent[]): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      // Sadece bugünün etkinliklerini filtrele
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.startDate.startsWith(today));

      // Widget için basitleştirilmiş veri
      const widgetData = todayEvents.map(e => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        allDay: e.allDay,
        color: e.color || 'blue',
        location: e.location?.address || '',
      }));

      await WidgetModule.updateCalendarWidget(JSON.stringify(widgetData));
      return true;
    } catch (error) {
      console.error('updateCalendarWidget error:', error);
      return false;
    }
  }

  /**
   * Arama widget'ını güncelle (son aramalar)
   */
  async updateCallsWidget(recentCalls: RecentCallData[]): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      // Son 4 aramayı al
      const callsData = recentCalls.slice(0, 4);
      await WidgetModule.updateCallsWidget(JSON.stringify(callsData));
      return true;
    } catch (error) {
      console.error('updateCallsWidget error:', error);
      return false;
    }
  }

  /**
   * Favoriler widget'ını güncelle
   */
  async updateFavoritesWidget(favorites: FavoriteContactData[]): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      // İlk 4 favoriyi al
      const favoritesData = favorites.slice(0, 4);
      await WidgetModule.updateFavoritesWidget(JSON.stringify(favoritesData));
      return true;
    } catch (error) {
      console.error('updateFavoritesWidget error:', error);
      return false;
    }
  }

  /**
   * Tüm widget'ları yenile
   */
  async refreshAllWidgets(): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      await WidgetModule.refreshAllWidgets();
      return true;
    } catch (error) {
      console.error('refreshAllWidgets error:', error);
      return false;
    }
  }

  /**
   * Takvim widget'ı ekli mi kontrol et
   */
  async hasCalendarWidget(): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      return await WidgetModule.hasCalendarWidget();
    } catch (error) {
      return false;
    }
  }

  /**
   * Arama widget'ı ekli mi kontrol et
   */
  async hasCallsWidget(): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      return await WidgetModule.hasCallsWidget();
    } catch (error) {
      return false;
    }
  }

  /**
   * Widget ekleme isteği gönder (Android 8+)
   */
  async requestWidgetPin(widgetType: 'calendar' | 'calls'): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      return await WidgetModule.requestWidgetPin(widgetType);
    } catch (error) {
      console.error('requestWidgetPin error:', error);
      return false;
    }
  }

  /**
   * Tüm widget verilerini güncelle
   */
  async updateAllWidgetData(
    events: CalendarEvent[],
    recentCalls: RecentCallData[],
    favorites: FavoriteContactData[]
  ): Promise<void> {
    await Promise.all([
      this.updateCalendarWidget(events),
      this.updateCallsWidget(recentCalls),
      this.updateFavoritesWidget(favorites),
    ]);
  }
}

export const widgetService = new WidgetService();
export default widgetService;
