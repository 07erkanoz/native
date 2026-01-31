/**
 * LifeCall - Calendar Redux Slice
 *
 * Takvim verilerini ve durumunu yönetir
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import uuid from 'react-native-uuid';

import {
  CalendarState,
  CalendarEvent,
  Calendar,
  CalendarViewMode,
  CalendarSettings,
  SyncInfo,
  GoogleAccountInfo,
  CreateEventPayload,
  UpdateEventPayload,
  DateRange,
  DEFAULT_CALENDAR_SETTINGS,
  DEFAULT_LOCAL_CALENDAR,
  EventReminder,
} from '../../types/calendar';

// ============================================
// INITIAL STATE
// ============================================

const initialState: CalendarState = {
  // Veriler
  events: [],
  calendars: [DEFAULT_LOCAL_CALENDAR],

  // UI state
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  viewMode: 'month',
  selectedEventId: null,

  // Senkronizasyon
  syncInfo: {
    status: 'idle',
    pendingChanges: 0,
  },
  googleAccount: null,

  // Ayarlar
  settings: DEFAULT_CALENDAR_SETTINGS,

  // Loading states
  isLoading: false,
  isLoadingEvents: false,
  isSyncing: false,

  // Error
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Etkinlikleri yükle
 */
export const loadEvents = createAsyncThunk(
  'calendar/loadEvents',
  async (dateRange: DateRange | undefined, { getState, rejectWithValue }) => {
    try {
      // TODO: AsyncStorage veya veritabanından etkinlikleri yükle
      // Şimdilik state'teki etkinlikleri döndür
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Google ile senkronize et
 */
export const syncWithGoogle = createAsyncThunk(
  'calendar/syncWithGoogle',
  async (_, { getState, rejectWithValue }) => {
    try {
      // TODO: Google Calendar API ile senkronizasyon
      // 1. Yeni etkinlikleri çek
      // 2. Yerel değişiklikleri gönder
      // 3. Çakışmaları çöz
      return {
        syncedEvents: [],
        lastSyncTime: Date.now(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Google hesabı bağla
 */
export const connectGoogleAccount = createAsyncThunk(
  'calendar/connectGoogleAccount',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Google Sign-In entegrasyonu
      // @react-native-google-signin/google-signin kullanılacak
      const accountInfo: GoogleAccountInfo = {
        email: '',
        isConnected: false,
      };
      return accountInfo;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * ICS dosyası import et
 */
export const importICSFile = createAsyncThunk(
  'calendar/importICSFile',
  async (fileUri: string, { rejectWithValue }) => {
    try {
      // TODO: ICS dosyasını parse et ve etkinlikleri import et
      return {
        success: true,
        totalEvents: 0,
        importedEvents: 0,
        skippedEvents: 0,
        errors: [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Excel dosyası import et
 */
export const importExcelFile = createAsyncThunk(
  'calendar/importExcelFile',
  async (fileUri: string, { rejectWithValue }) => {
    try {
      // TODO: Excel dosyasını parse et ve etkinlikleri import et
      return {
        success: true,
        totalEvents: 0,
        importedEvents: 0,
        skippedEvents: 0,
        errors: [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    // ==========================================
    // ETKİNLİK İŞLEMLERİ
    // ==========================================

    /**
     * Yeni etkinlik oluştur
     */
    createEvent: (state, action: PayloadAction<CreateEventPayload>) => {
      const payload = action.payload;
      const now = new Date().toISOString();

      const reminders: EventReminder[] = (payload.reminders || []).map((r) => ({
        ...r,
        id: uuid.v4() as string,
      }));

      const newEvent: CalendarEvent = {
        id: uuid.v4() as string,
        title: payload.title,
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
        allDay: payload.allDay ?? false,
        location: payload.location,
        reminders,
        recurrence: payload.recurrence,
        color: payload.color,
        calendarId: payload.calendarId || state.settings.defaultCalendarId,
        contactIds: payload.contactIds,
        noteIds: payload.noteIds,
        isGoogleEvent: false,
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
        isCallReminder: payload.isCallReminder,
        callReminderPhoneNumber: payload.callReminderPhoneNumber,
      };

      state.events.push(newEvent);
      state.syncInfo.pendingChanges += 1;
    },

    /**
     * Etkinlik güncelle
     */
    updateEvent: (state, action: PayloadAction<UpdateEventPayload>) => {
      const { id, updates } = action.payload;
      const index = state.events.findIndex((e) => e.id === id);

      if (index !== -1) {
        state.events[index] = {
          ...state.events[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        state.syncInfo.pendingChanges += 1;
      }
    },

    /**
     * Etkinlik sil
     */
    deleteEvent: (state, action: PayloadAction<string>) => {
      const eventId = action.payload;
      state.events = state.events.filter((e) => e.id !== eventId);
      state.syncInfo.pendingChanges += 1;

      if (state.selectedEventId === eventId) {
        state.selectedEventId = null;
      }
    },

    /**
     * Etkinlik seç
     */
    selectEvent: (state, action: PayloadAction<string | null>) => {
      state.selectedEventId = action.payload;
    },

    // ==========================================
    // TAKVİM İŞLEMLERİ
    // ==========================================

    /**
     * Takvim ekle
     */
    addCalendar: (state, action: PayloadAction<Omit<Calendar, 'id'>>) => {
      const newCalendar: Calendar = {
        ...action.payload,
        id: uuid.v4() as string,
      };
      state.calendars.push(newCalendar);
    },

    /**
     * Takvim güncelle
     */
    updateCalendar: (state, action: PayloadAction<{ id: string; updates: Partial<Calendar> }>) => {
      const { id, updates } = action.payload;
      const index = state.calendars.findIndex((c) => c.id === id);

      if (index !== -1) {
        state.calendars[index] = {
          ...state.calendars[index],
          ...updates,
        };
      }
    },

    /**
     * Takvim sil
     */
    deleteCalendar: (state, action: PayloadAction<string>) => {
      const calendarId = action.payload;

      // Yerel takvim silinemez
      if (calendarId === 'local') return;

      state.calendars = state.calendars.filter((c) => c.id !== calendarId);
      // Bu takvime ait etkinlikleri de sil
      state.events = state.events.filter((e) => e.calendarId !== calendarId);
    },

    /**
     * Takvim görünürlüğünü değiştir
     */
    toggleCalendarVisibility: (state, action: PayloadAction<string>) => {
      const calendarId = action.payload;
      const calendar = state.calendars.find((c) => c.id === calendarId);

      if (calendar) {
        calendar.isVisible = !calendar.isVisible;
      }
    },

    // ==========================================
    // UI İŞLEMLERİ
    // ==========================================

    /**
     * Tarih seç
     */
    selectDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },

    /**
     * Görünüm modunu değiştir
     */
    setViewMode: (state, action: PayloadAction<CalendarViewMode>) => {
      state.viewMode = action.payload;
    },

    /**
     * Sonraki aya git
     */
    goToNextMonth: (state) => {
      const currentDate = parseISO(state.selectedDate);
      const nextMonth = addMonths(currentDate, 1);
      state.selectedDate = format(nextMonth, 'yyyy-MM-dd');
    },

    /**
     * Önceki aya git
     */
    goToPreviousMonth: (state) => {
      const currentDate = parseISO(state.selectedDate);
      const prevMonth = subMonths(currentDate, 1);
      state.selectedDate = format(prevMonth, 'yyyy-MM-dd');
    },

    /**
     * Bugüne git
     */
    goToToday: (state) => {
      state.selectedDate = format(new Date(), 'yyyy-MM-dd');
    },

    // ==========================================
    // AYARLAR
    // ==========================================

    /**
     * Ayarları güncelle
     */
    updateSettings: (state, action: PayloadAction<Partial<CalendarSettings>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    /**
     * Ayarları sıfırla
     */
    resetSettings: (state) => {
      state.settings = DEFAULT_CALENDAR_SETTINGS;
    },

    // ==========================================
    // SENKRONİZASYON
    // ==========================================

    /**
     * Google hesabı bağlantısını kes
     */
    disconnectGoogleAccount: (state) => {
      state.googleAccount = null;
      state.settings.googleSyncEnabled = false;

      // Google etkinliklerini sil
      state.events = state.events.filter((e) => !e.isGoogleEvent);
      state.calendars = state.calendars.filter((c) => !c.isGoogleCalendar);
    },

    /**
     * Senkronizasyon durumunu güncelle
     */
    updateSyncInfo: (state, action: PayloadAction<Partial<SyncInfo>>) => {
      state.syncInfo = {
        ...state.syncInfo,
        ...action.payload,
      };
    },

    // ==========================================
    // HATA YÖNETİMİ
    // ==========================================

    /**
     * Hatayı temizle
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * State'i sıfırla
     */
    resetCalendarState: () => initialState,
  },

  extraReducers: (builder) => {
    // loadEvents
    builder
      .addCase(loadEvents.pending, (state) => {
        state.isLoadingEvents = true;
        state.error = null;
      })
      .addCase(loadEvents.fulfilled, (state, action) => {
        state.isLoadingEvents = false;
        // Yüklenen etkinlikleri mevcut etkinliklerle birleştir
        // state.events = action.payload;
      })
      .addCase(loadEvents.rejected, (state, action) => {
        state.isLoadingEvents = false;
        state.error = action.payload as string;
      });

    // syncWithGoogle
    builder
      .addCase(syncWithGoogle.pending, (state) => {
        state.isSyncing = true;
        state.syncInfo.status = 'syncing';
        state.error = null;
      })
      .addCase(syncWithGoogle.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.syncInfo.status = 'success';
        state.syncInfo.lastSyncTime = action.payload.lastSyncTime;
        state.syncInfo.pendingChanges = 0;
      })
      .addCase(syncWithGoogle.rejected, (state, action) => {
        state.isSyncing = false;
        state.syncInfo.status = 'error';
        state.syncInfo.lastSyncError = action.payload as string;
        state.error = action.payload as string;
      });

    // connectGoogleAccount
    builder
      .addCase(connectGoogleAccount.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(connectGoogleAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.googleAccount = action.payload;
        state.settings.googleSyncEnabled = action.payload.isConnected;
      })
      .addCase(connectGoogleAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // importICSFile
    builder
      .addCase(importICSFile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(importICSFile.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(importICSFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // importExcelFile
    builder
      .addCase(importExcelFile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(importExcelFile.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(importExcelFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================
// SELECTORS
// ============================================

/**
 * Seçili tarihteki etkinlikleri al
 */
export const selectEventsByDate = (state: { calendar: CalendarState }, date: string) => {
  return state.calendar.events.filter((event) => {
    const eventStart = event.startDate.split('T')[0];
    const eventEnd = event.endDate.split('T')[0];
    return date >= eventStart && date <= eventEnd;
  });
};

/**
 * Görünür takvimlerdeki etkinlikleri al
 */
export const selectVisibleEvents = (state: { calendar: CalendarState }) => {
  const visibleCalendarIds = state.calendar.calendars
    .filter((c) => c.isVisible)
    .map((c) => c.id);

  return state.calendar.events.filter((e) => visibleCalendarIds.includes(e.calendarId));
};

/**
 * Tarih aralığındaki etkinlikleri al
 */
export const selectEventsByDateRange = (
  state: { calendar: CalendarState },
  startDate: string,
  endDate: string
) => {
  return state.calendar.events.filter((event) => {
    const eventStart = event.startDate.split('T')[0];
    return eventStart >= startDate && eventStart <= endDate;
  });
};

/**
 * Aylık görünüm için etkinlikleri al
 */
export const selectEventsForMonth = (state: { calendar: CalendarState }) => {
  const selectedDate = parseISO(state.calendar.selectedDate);
  const monthStart = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

  return selectEventsByDateRange(state, monthStart, monthEnd);
};

/**
 * Seçili etkinliği al
 */
export const selectSelectedEvent = (state: { calendar: CalendarState }) => {
  if (!state.calendar.selectedEventId) return null;
  return state.calendar.events.find((e) => e.id === state.calendar.selectedEventId) || null;
};

/**
 * Kişiye bağlı etkinlikleri al
 */
export const selectEventsByContact = (state: { calendar: CalendarState }, contactId: string) => {
  return state.calendar.events.filter((e) => e.contactIds?.includes(contactId));
};

/**
 * Arama hatırlatıcılarını al
 */
export const selectCallReminders = (state: { calendar: CalendarState }) => {
  return state.calendar.events.filter((e) => e.isCallReminder);
};

// ============================================
// EXPORTS
// ============================================

export const {
  // Etkinlik işlemleri
  createEvent,
  updateEvent,
  deleteEvent,
  selectEvent,

  // Takvim işlemleri
  addCalendar,
  updateCalendar,
  deleteCalendar,
  toggleCalendarVisibility,

  // UI işlemleri
  selectDate,
  setViewMode,
  goToNextMonth,
  goToPreviousMonth,
  goToToday,

  // Ayarlar
  updateSettings,
  resetSettings,

  // Senkronizasyon
  disconnectGoogleAccount,
  updateSyncInfo,

  // Hata yönetimi
  clearError,
  resetCalendarState,
} = calendarSlice.actions;

export default calendarSlice.reducer;
