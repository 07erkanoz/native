/**
 * LifeCall - ICS Import/Export Servisi
 *
 * iCalendar (ICS) formatında takvim etkinliklerini import/export eder.
 */

import { Platform, Share } from 'react-native';
import RNFS from 'react-native-fs';
import { CalendarEvent, EventReminder, EventRecurrence, ImportResult, ExportOptions } from '../../types/calendar';

/**
 * ICS dosya formatı sabitleri
 */
const ICS_HEADER = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LifeCall//Calendar//TR
CALSCALE:GREGORIAN
METHOD:PUBLISH`;

const ICS_FOOTER = `END:VCALENDAR`;

/**
 * RRULE frequency mapping
 */
const FREQUENCY_MAP: Record<string, string> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
};

const REVERSE_FREQUENCY_MAP: Record<string, string> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

/**
 * ICS Servisi
 */
class ICSService {
  /**
   * ICS dosyasından etkinlikleri parse et
   */
  parseICS(icsContent: string): Partial<CalendarEvent>[] {
    const events: Partial<CalendarEvent>[] = [];
    const lines = icsContent.split(/\r?\n/);

    let currentEvent: Partial<CalendarEvent> | null = null;
    let currentField = '';
    let currentValue = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Devam satırları (bir boşluk veya tab ile başlar)
      if (line.startsWith(' ') || line.startsWith('\t')) {
        currentValue += line.substring(1);
        continue;
      }

      // Önceki alanı işle
      if (currentField && currentEvent) {
        this.processField(currentEvent, currentField, currentValue);
      }

      // Satırı ayrıştır
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const fieldPart = line.substring(0, colonIndex);
      const valuePart = line.substring(colonIndex + 1);

      // Parametreleri ayır (örn: DTSTART;VALUE=DATE:20240101)
      const semicolonIndex = fieldPart.indexOf(';');
      currentField = semicolonIndex === -1 ? fieldPart : fieldPart.substring(0, semicolonIndex);
      currentValue = valuePart;

      // Event başlangıcı
      if (currentField === 'BEGIN' && currentValue === 'VEVENT') {
        currentEvent = {
          id: `ics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          reminders: [],
          status: 'confirmed',
          isGoogleEvent: false,
          calendarId: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        currentField = '';
        currentValue = '';
        continue;
      }

      // Event sonu
      if (currentField === 'END' && currentValue === 'VEVENT') {
        if (currentEvent && currentEvent.title && currentEvent.startDate) {
          // endDate yoksa startDate ile aynı yap
          if (!currentEvent.endDate) {
            currentEvent.endDate = currentEvent.startDate;
          }
          events.push(currentEvent);
        }
        currentEvent = null;
        currentField = '';
        currentValue = '';
        continue;
      }
    }

    return events;
  }

  /**
   * ICS alanını işle
   */
  private processField(event: Partial<CalendarEvent>, field: string, value: string): void {
    // Escape karakterlerini çöz
    value = this.unescapeICS(value);

    switch (field) {
      case 'UID':
        // Eğer Google Calendar'dan geldiyse googleEventId olarak kaydet
        if (value.includes('@google.com')) {
          event.googleEventId = value.split('@')[0];
        }
        break;

      case 'SUMMARY':
        event.title = value;
        break;

      case 'DESCRIPTION':
        event.description = value;
        break;

      case 'LOCATION':
        event.location = { address: value };
        break;

      case 'DTSTART':
        const startResult = this.parseICSDate(value);
        event.startDate = startResult.date;
        event.allDay = startResult.allDay;
        break;

      case 'DTEND':
        const endResult = this.parseICSDate(value);
        event.endDate = endResult.date;
        break;

      case 'RRULE':
        event.recurrence = this.parseRRule(value);
        break;

      case 'VALARM':
        // VALARM ayrı işlenir
        break;

      case 'TRIGGER':
        // Hatırlatıcı süresi
        const minutes = this.parseTrigger(value);
        if (minutes !== null && event.reminders) {
          event.reminders.push({
            id: `reminder_${event.reminders.length}`,
            minutes,
            type: 'notification',
          });
        }
        break;

      case 'CREATED':
        event.createdAt = this.parseICSDate(value).date;
        break;

      case 'LAST-MODIFIED':
        event.updatedAt = this.parseICSDate(value).date;
        break;

      case 'STATUS':
        if (value === 'CANCELLED') {
          event.status = 'cancelled';
        } else if (value === 'TENTATIVE') {
          event.status = 'tentative';
        } else {
          event.status = 'confirmed';
        }
        break;
    }
  }

  /**
   * ICS tarih formatını parse et
   */
  private parseICSDate(value: string): { date: string; allDay: boolean } {
    // Tüm gün etkinliği: 20240101
    if (value.length === 8 && /^\d{8}$/.test(value)) {
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      return {
        date: `${year}-${month}-${day}T00:00:00.000Z`,
        allDay: true,
      };
    }

    // Normal tarih-saat: 20240101T120000Z veya 20240101T120000
    const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
    if (match) {
      const [, year, month, day, hour, minute, second, utc] = match;
      const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}${utc ? '.000Z' : ''}`;
      return {
        date: utc ? dateStr : new Date(dateStr).toISOString(),
        allDay: false,
      };
    }

    // Fallback
    return {
      date: new Date().toISOString(),
      allDay: false,
    };
  }

  /**
   * RRULE parse et
   */
  private parseRRule(value: string): EventRecurrence {
    const recurrence: EventRecurrence = {
      frequency: 'daily',
      interval: 1,
    };

    const parts = value.split(';');
    for (const part of parts) {
      const [key, val] = part.split('=');

      switch (key) {
        case 'FREQ':
          recurrence.frequency = (REVERSE_FREQUENCY_MAP[val] || 'daily') as any;
          break;

        case 'INTERVAL':
          recurrence.interval = parseInt(val, 10) || 1;
          break;

        case 'BYDAY':
          // MO,TU,WE,TH,FR,SA,SU -> 1,2,3,4,5,6,0
          const dayMap: Record<string, number> = {
            SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
          };
          recurrence.daysOfWeek = val.split(',').map(d => dayMap[d]).filter(d => d !== undefined);
          break;

        case 'BYMONTHDAY':
          recurrence.dayOfMonth = parseInt(val, 10);
          break;

        case 'BYMONTH':
          recurrence.monthOfYear = parseInt(val, 10);
          break;

        case 'UNTIL':
          const until = this.parseICSDate(val);
          recurrence.endDate = until.date;
          break;

        case 'COUNT':
          recurrence.count = parseInt(val, 10);
          break;
      }
    }

    return recurrence;
  }

  /**
   * TRIGGER parse et (dakika olarak döndür)
   */
  private parseTrigger(value: string): number | null {
    // -PT15M -> 15 dakika önce
    // -P1D -> 1 gün önce
    const match = value.match(/^-?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
    if (!match) return null;

    const [, days, hours, minutes, seconds] = match;
    let totalMinutes = 0;

    if (days) totalMinutes += parseInt(days, 10) * 24 * 60;
    if (hours) totalMinutes += parseInt(hours, 10) * 60;
    if (minutes) totalMinutes += parseInt(minutes, 10);
    if (seconds) totalMinutes += Math.ceil(parseInt(seconds, 10) / 60);

    return totalMinutes || null;
  }

  /**
   * ICS escape karakterlerini çöz
   */
  private unescapeICS(value: string): string {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Metni ICS formatı için escape et
   */
  private escapeICS(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Tarihi ICS formatına dönüştür
   */
  private formatICSDate(dateStr: string, allDay: boolean): string {
    const date = new Date(dateStr);

    if (allDay) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    }

    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * RRULE oluştur
   */
  private formatRRule(recurrence: EventRecurrence): string {
    const parts: string[] = [];

    parts.push(`FREQ=${FREQUENCY_MAP[recurrence.frequency] || 'DAILY'}`);

    if (recurrence.interval && recurrence.interval > 1) {
      parts.push(`INTERVAL=${recurrence.interval}`);
    }

    if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
      const dayMap: Record<number, string> = {
        0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA',
      };
      const days = recurrence.daysOfWeek.map(d => dayMap[d]).join(',');
      parts.push(`BYDAY=${days}`);
    }

    if (recurrence.dayOfMonth) {
      parts.push(`BYMONTHDAY=${recurrence.dayOfMonth}`);
    }

    if (recurrence.monthOfYear) {
      parts.push(`BYMONTH=${recurrence.monthOfYear}`);
    }

    if (recurrence.endDate) {
      parts.push(`UNTIL=${this.formatICSDate(recurrence.endDate, false)}`);
    }

    if (recurrence.count) {
      parts.push(`COUNT=${recurrence.count}`);
    }

    return parts.join(';');
  }

  /**
   * Hatırlatıcı için VALARM oluştur
   */
  private formatVAlarm(reminder: EventReminder): string {
    const trigger = reminder.minutes >= 1440
      ? `-P${Math.floor(reminder.minutes / 1440)}D`
      : reminder.minutes >= 60
        ? `-PT${Math.floor(reminder.minutes / 60)}H${reminder.minutes % 60 > 0 ? (reminder.minutes % 60) + 'M' : ''}`
        : `-PT${reminder.minutes}M`;

    return `BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Hatırlatıcı
TRIGGER:${trigger}
END:VALARM`;
  }

  /**
   * CalendarEvent'i VEVENT formatına dönüştür
   */
  private formatVEvent(event: CalendarEvent): string {
    const lines: string[] = ['BEGIN:VEVENT'];

    // UID
    const uid = event.googleEventId
      ? `${event.googleEventId}@google.com`
      : `${event.id}@lifecall.app`;
    lines.push(`UID:${uid}`);

    // Tarihler
    const dtstart = event.allDay
      ? `DTSTART;VALUE=DATE:${this.formatICSDate(event.startDate, true)}`
      : `DTSTART:${this.formatICSDate(event.startDate, false)}`;
    lines.push(dtstart);

    const dtend = event.allDay
      ? `DTEND;VALUE=DATE:${this.formatICSDate(event.endDate, true)}`
      : `DTEND:${this.formatICSDate(event.endDate, false)}`;
    lines.push(dtend);

    // Başlık
    lines.push(`SUMMARY:${this.escapeICS(event.title)}`);

    // Açıklama
    if (event.description) {
      lines.push(`DESCRIPTION:${this.escapeICS(event.description)}`);
    }

    // Konum
    if (event.location?.address) {
      lines.push(`LOCATION:${this.escapeICS(event.location.address)}`);
    }

    // Tekrar
    if (event.recurrence) {
      lines.push(`RRULE:${this.formatRRule(event.recurrence)}`);
    }

    // Durum
    const statusMap: Record<string, string> = {
      confirmed: 'CONFIRMED',
      tentative: 'TENTATIVE',
      cancelled: 'CANCELLED',
    };
    lines.push(`STATUS:${statusMap[event.status] || 'CONFIRMED'}`);

    // Tarihler
    lines.push(`CREATED:${this.formatICSDate(event.createdAt, false)}`);
    lines.push(`LAST-MODIFIED:${this.formatICSDate(event.updatedAt, false)}`);
    lines.push(`DTSTAMP:${this.formatICSDate(new Date().toISOString(), false)}`);

    // Hatırlatıcılar
    for (const reminder of event.reminders) {
      lines.push(this.formatVAlarm(reminder));
    }

    lines.push('END:VEVENT');

    return lines.join('\n');
  }

  /**
   * Etkinlikleri ICS formatına export et
   */
  exportToICS(events: CalendarEvent[], options?: ExportOptions): string {
    let filteredEvents = events;

    // Tarih filtreleme
    if (options?.startDate) {
      const startDate = new Date(options.startDate);
      filteredEvents = filteredEvents.filter(e => new Date(e.startDate) >= startDate);
    }

    if (options?.endDate) {
      const endDate = new Date(options.endDate);
      filteredEvents = filteredEvents.filter(e => new Date(e.startDate) <= endDate);
    }

    // Takvim filtreleme
    if (options?.calendarIds && options.calendarIds.length > 0) {
      filteredEvents = filteredEvents.filter(e => options.calendarIds!.includes(e.calendarId));
    }

    const vevents = filteredEvents.map(e => this.formatVEvent(e)).join('\n');

    return `${ICS_HEADER}\n${vevents}\n${ICS_FOOTER}`;
  }

  /**
   * ICS dosyasını oku ve parse et
   */
  async importFromFile(filePath: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalEvents: 0,
      importedEvents: 0,
      skippedEvents: 0,
      errors: [],
    };

    try {
      const content = await RNFS.readFile(filePath, 'utf8');
      const events = this.parseICS(content);

      result.totalEvents = events.length;

      for (const event of events) {
        if (event.title && event.startDate) {
          result.importedEvents++;
        } else {
          result.skippedEvents++;
          if (!event.title) {
            result.errors.push('Başlıksız etkinlik atlandı');
          }
        }
      }

      result.success = result.importedEvents > 0;
    } catch (error: any) {
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * ICS dosyasını kaydet
   */
  async saveToFile(events: CalendarEvent[], fileName: string = 'lifecall_calendar.ics'): Promise<string> {
    const content = this.exportToICS(events);
    const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    await RNFS.writeFile(path, content, 'utf8');

    return path;
  }

  /**
   * ICS dosyasını paylaş
   */
  async shareICS(events: CalendarEvent[], fileName: string = 'lifecall_calendar.ics'): Promise<void> {
    const path = await this.saveToFile(events, fileName);

    await Share.share({
      title: 'Takvim Etkinlikleri',
      message: 'LifeCall takvim etkinlikleri',
      url: Platform.OS === 'android' ? `file://${path}` : path,
    });
  }
}

export const icsService = new ICSService();
export default icsService;
