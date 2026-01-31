/**
 * LifeCall - Takvim Bildirim Modülü (TypeScript)
 *
 * Native AlarmManager ile entegre takvim hatırlatıcı servisi.
 */

import { NativeModules, Platform } from 'react-native';

const { CalendarNotificationModule } = NativeModules;

export interface ScheduleReminderParams {
  eventId: string;
  reminderId: string;
  title: string;
  description?: string;
  triggerTime: number; // Unix timestamp in milliseconds
  isCallReminder?: boolean;
  phoneNumber?: string;
}

export interface ScheduleReminderResult {
  eventId: string;
  reminderId: string;
  triggerTime: number;
  scheduled: boolean;
}

export interface CancelReminderResult {
  eventId: string;
  reminderId: string;
  cancelled: boolean;
}

/**
 * Takvim bildirim servisi
 */
class CalendarNotificationService {
  private isAndroid = Platform.OS === 'android';

  /**
   * Hatırlatıcı planla
   */
  async scheduleReminder(params: ScheduleReminderParams): Promise<ScheduleReminderResult> {
    if (!this.isAndroid) {
      console.warn('CalendarNotificationService: iOS desteklenmiyor');
      return {
        eventId: params.eventId,
        reminderId: params.reminderId,
        triggerTime: params.triggerTime,
        scheduled: false,
      };
    }

    try {
      return await CalendarNotificationModule.scheduleReminder(
        params.eventId,
        params.reminderId,
        params.title,
        params.description || '',
        params.triggerTime,
        params.isCallReminder || false,
        params.phoneNumber || ''
      );
    } catch (error) {
      console.error('scheduleReminder error:', error);
      throw error;
    }
  }

  /**
   * Birden fazla hatırlatıcı planla (bir etkinlik için)
   */
  async scheduleReminders(
    eventId: string,
    title: string,
    eventStartTime: number, // Unix timestamp in ms
    reminderMinutes: number[], // Kaç dakika önce
    isCallReminder?: boolean,
    phoneNumber?: string,
    description?: string
  ): Promise<ScheduleReminderResult[]> {
    const results: ScheduleReminderResult[] = [];

    for (let i = 0; i < reminderMinutes.length; i++) {
      const minutes = reminderMinutes[i];
      const triggerTime = eventStartTime - minutes * 60 * 1000;

      // Geçmiş zamanlı hatırlatıcıları atla
      if (triggerTime <= Date.now()) {
        continue;
      }

      const result = await this.scheduleReminder({
        eventId,
        reminderId: `${eventId}_reminder_${i}`,
        title,
        description,
        triggerTime,
        isCallReminder,
        phoneNumber,
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Hatırlatıcı iptal et
   */
  async cancelReminder(eventId: string, reminderId: string): Promise<CancelReminderResult> {
    if (!this.isAndroid) {
      return { eventId, reminderId, cancelled: false };
    }

    try {
      return await CalendarNotificationModule.cancelReminder(eventId, reminderId);
    } catch (error) {
      console.error('cancelReminder error:', error);
      throw error;
    }
  }

  /**
   * Bir etkinliğin tüm hatırlatıcılarını iptal et
   */
  async cancelAllRemindersForEvent(eventId: string): Promise<{ eventId: string; cancelled: boolean }> {
    if (!this.isAndroid) {
      return { eventId, cancelled: false };
    }

    try {
      return await CalendarNotificationModule.cancelAllRemindersForEvent(eventId);
    } catch (error) {
      console.error('cancelAllRemindersForEvent error:', error);
      throw error;
    }
  }

  /**
   * Tüm hatırlatıcıları iptal et
   */
  async cancelAllReminders(): Promise<{ cancelled: boolean }> {
    if (!this.isAndroid) {
      return { cancelled: false };
    }

    try {
      return await CalendarNotificationModule.cancelAllReminders();
    } catch (error) {
      console.error('cancelAllReminders error:', error);
      throw error;
    }
  }

  /**
   * Anında bildirim göster (test için)
   */
  async showNotification(title: string, body: string, eventId: string): Promise<boolean> {
    if (!this.isAndroid) {
      return false;
    }

    try {
      return await CalendarNotificationModule.showNotification(title, body, eventId);
    } catch (error) {
      console.error('showNotification error:', error);
      throw error;
    }
  }

  /**
   * Exact alarm izni var mı kontrol et (Android 12+)
   */
  async canScheduleExactAlarms(): Promise<boolean> {
    if (!this.isAndroid) {
      return true;
    }

    try {
      return await CalendarNotificationModule.canScheduleExactAlarms();
    } catch (error) {
      console.error('canScheduleExactAlarms error:', error);
      return false;
    }
  }

  /**
   * Exact alarm ayarlarını aç
   */
  async openExactAlarmSettings(): Promise<boolean> {
    if (!this.isAndroid) {
      return false;
    }

    try {
      return await CalendarNotificationModule.openExactAlarmSettings();
    } catch (error) {
      console.error('openExactAlarmSettings error:', error);
      return false;
    }
  }

  /**
   * Bildirim izni var mı kontrol et
   */
  async areNotificationsEnabled(): Promise<boolean> {
    if (!this.isAndroid) {
      return true;
    }

    try {
      return await CalendarNotificationModule.areNotificationsEnabled();
    } catch (error) {
      console.error('areNotificationsEnabled error:', error);
      return false;
    }
  }

  /**
   * Bildirim ayarlarını aç
   */
  async openNotificationSettings(): Promise<boolean> {
    if (!this.isAndroid) {
      return false;
    }

    try {
      return await CalendarNotificationModule.openNotificationSettings();
    } catch (error) {
      console.error('openNotificationSettings error:', error);
      return false;
    }
  }
}

export const calendarNotificationService = new CalendarNotificationService();
export default calendarNotificationService;
