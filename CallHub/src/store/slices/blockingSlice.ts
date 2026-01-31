/**
 * LifeCall - Blocking Redux Slice
 *
 * Arama engelleme ve spam yönetimi state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import uuid from 'react-native-uuid';
import { RootState } from '../index';
import {
  BlockingState,
  BlockedNumber,
  MutedContact,
  SpamReport,
  SpamNumber,
  SpamCheckResult,
  BlockingSettings,
  BlockNumberPayload,
  UnblockNumberPayload,
  ReportSpamPayload,
  MuteContactPayload,
  DEFAULT_BLOCKING_SETTINGS,
  SpamCategory,
  BlockReason,
} from '../../types/blocking';

// Native modül (daha sonra oluşturulacak)
// import BlockingModule from '../../native/BlockingModule';

// ==================== Initial State ====================

const initialState: BlockingState = {
  blockedNumbers: [],
  mutedContacts: [],
  localSpamList: [],
  pendingReports: [],
  spamCheckCache: {},
  settings: DEFAULT_BLOCKING_SETTINGS,
  isLoading: false,
  isSyncing: false,
  lastSyncAt: undefined,
  error: undefined,
  stats: {
    totalBlocked: 0,
    blockedToday: 0,
    spamDetected: 0,
    reportsSubmitted: 0,
  },
};

// ==================== Async Thunks ====================

/**
 * Numara engelle
 */
export const blockNumber = createAsyncThunk(
  'blocking/blockNumber',
  async (payload: BlockNumberPayload, { getState, rejectWithValue }) => {
    try {
      const { phoneNumber, reason, customReason, displayName } = payload;

      // Numarayı normalize et
      const normalizedNumber = normalizePhoneNumber(phoneNumber);

      // Native BlockedNumberContract'a ekle
      // await BlockingModule.addToBlocklist(normalizedNumber);

      const blockedNumber: BlockedNumber = {
        id: uuid.v4() as string,
        phoneNumber,
        normalizedNumber,
        displayName,
        reason,
        customReason,
        blockedAt: new Date().toISOString(),
        callAttempts: 0,
        isSystemBlocked: true,
        source: 'local',
      };

      return blockedNumber;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Numara engellenemedi');
    }
  }
);

/**
 * Engeli kaldır
 */
export const unblockNumber = createAsyncThunk(
  'blocking/unblockNumber',
  async (payload: UnblockNumberPayload, { rejectWithValue }) => {
    try {
      const { phoneNumber, removeFromSystem = true } = payload;

      // Native BlockedNumberContract'tan kaldır
      if (removeFromSystem) {
        // await BlockingModule.removeFromBlocklist(normalizePhoneNumber(phoneNumber));
      }

      return phoneNumber;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Engel kaldırılamadı');
    }
  }
);

/**
 * Spam raporla
 */
export const reportSpam = createAsyncThunk(
  'blocking/reportSpam',
  async (payload: ReportSpamPayload, { getState, rejectWithValue }) => {
    try {
      const { phoneNumber, category, description, callerName, callDuration } = payload;

      const report: SpamReport = {
        id: uuid.v4() as string,
        phoneNumber,
        normalizedNumber: normalizePhoneNumber(phoneNumber),
        category,
        description,
        callerName,
        callDuration,
        reportedBy: 'anonymous', // TODO: Gerçek kullanıcı ID
        reportedAt: new Date().toISOString(),
        status: 'pending',
      };

      // TODO: Supabase'e gönder
      // await supabase.from('spam_reports').insert(report);

      return report;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Spam raporu gönderilemedi');
    }
  }
);

/**
 * Spam kontrol et
 */
export const checkSpam = createAsyncThunk(
  'blocking/checkSpam',
  async (phoneNumber: string, { getState, rejectWithValue }) => {
    try {
      const normalizedNumber = normalizePhoneNumber(phoneNumber);
      const state = getState() as RootState;

      // Önce cache'e bak
      const cached = state.blocking.spamCheckCache[normalizedNumber];
      if (cached && isRecentCheck(cached.checkedAt)) {
        return cached;
      }

      // Yerel listede kontrol et
      const localSpam = state.blocking.localSpamList.find(
        (s) => s.normalizedNumber === normalizedNumber
      );

      if (localSpam) {
        const result: SpamCheckResult = {
          phoneNumber,
          isSpam: true,
          spamScore: localSpam.spamScore,
          category: localSpam.category,
          reportCount: localSpam.reportCount,
          isVerified: localSpam.isVerified,
          source: 'local',
          checkedAt: new Date().toISOString(),
        };
        return result;
      }

      // TODO: Bulut API'den kontrol et
      // const cloudResult = await supabase
      //   .from('spam_numbers')
      //   .select('*')
      //   .eq('normalized_number', normalizedNumber)
      //   .single();

      const result: SpamCheckResult = {
        phoneNumber,
        isSpam: false,
        spamScore: 0,
        reportCount: 0,
        isVerified: false,
        source: 'local',
        checkedAt: new Date().toISOString(),
      };

      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Spam kontrolü başarısız');
    }
  }
);

/**
 * Engelli numaraları senkronize et (Android sistem listesiyle)
 */
export const syncWithSystem = createAsyncThunk(
  'blocking/syncWithSystem',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Native'den engelli numaraları al
      // const systemBlocked = await BlockingModule.getBlockedNumbers();

      // Simüle edilmiş veri
      const systemBlocked: string[] = [];

      return systemBlocked;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Senkronizasyon başarısız');
    }
  }
);

/**
 * Bulut veritabanıyla senkronize et
 */
export const syncWithCloud = createAsyncThunk(
  'blocking/syncWithCloud',
  async (_, { getState, rejectWithValue }) => {
    try {
      // TODO: Supabase'den spam listesini çek
      // const { data: spamList } = await supabase
      //   .from('spam_numbers')
      //   .select('*')
      //   .gte('spam_score', 50)
      //   .order('report_count', { ascending: false })
      //   .limit(1000);

      const spamList: SpamNumber[] = [];

      return {
        spamList,
        syncedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Bulut senkronizasyonu başarısız');
    }
  }
);

/**
 * Bekleyen raporları gönder
 */
export const submitPendingReports = createAsyncThunk(
  'blocking/submitPendingReports',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const pending = state.blocking.pendingReports;

      if (pending.length === 0) {
        return [];
      }

      // TODO: Toplu gönderim
      // await supabase.from('spam_reports').insert(pending);

      return pending.map((r) => r.id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Raporlar gönderilemedi');
    }
  }
);

// ==================== Slice ====================

const blockingSlice = createSlice({
  name: 'blocking',
  initialState,
  reducers: {
    // Kişiyi sessize al
    muteContact: (state, action: PayloadAction<MuteContactPayload>) => {
      const { contactId, phoneNumber, displayName, reason, muteUntil } = action.payload;
      const normalizedNumber = normalizePhoneNumber(phoneNumber);

      // Zaten sessize alınmışsa güncelle
      const existingIndex = state.mutedContacts.findIndex(
        (m) => m.normalizedNumber === normalizedNumber
      );

      const mutedContact: MutedContact = {
        id: existingIndex >= 0 ? state.mutedContacts[existingIndex].id : (uuid.v4() as string),
        contactId,
        phoneNumber,
        normalizedNumber,
        displayName,
        mutedAt: new Date().toISOString(),
        reason,
        muteUntil,
        isPermanent: !muteUntil,
      };

      if (existingIndex >= 0) {
        state.mutedContacts[existingIndex] = mutedContact;
      } else {
        state.mutedContacts.push(mutedContact);
      }

      state.settings.silentModeEnabled = state.mutedContacts.length > 0;
    },

    // Sessizden çıkar
    unmuteContact: (state, action: PayloadAction<string>) => {
      const phoneNumber = action.payload;
      const normalizedNumber = normalizePhoneNumber(phoneNumber);

      state.mutedContacts = state.mutedContacts.filter(
        (m) => m.normalizedNumber !== normalizedNumber
      );

      state.settings.silentModeEnabled = state.mutedContacts.length > 0;
    },

    // Arama denemesi kaydet
    recordBlockedCall: (state, action: PayloadAction<string>) => {
      const phoneNumber = action.payload;
      const normalizedNumber = normalizePhoneNumber(phoneNumber);

      const blocked = state.blockedNumbers.find(
        (b) => b.normalizedNumber === normalizedNumber
      );

      if (blocked) {
        blocked.callAttempts += 1;
        blocked.lastCallAttempt = new Date().toISOString();
        state.stats.blockedToday += 1;
      }
    },

    // Ayarları güncelle
    updateSettings: (state, action: PayloadAction<Partial<BlockingSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    // Spam cache'i güncelle
    updateSpamCache: (state, action: PayloadAction<SpamCheckResult>) => {
      const result = action.payload;
      const normalizedNumber = normalizePhoneNumber(result.phoneNumber);
      state.spamCheckCache[normalizedNumber] = result;
    },

    // Spam cache'i temizle
    clearSpamCache: (state) => {
      state.spamCheckCache = {};
    },

    // İstatistikleri sıfırla (günlük)
    resetDailyStats: (state) => {
      state.stats.blockedToday = 0;
    },

    // Hatayı temizle
    clearError: (state) => {
      state.error = undefined;
    },

    // Yerel spam listesine ekle
    addToLocalSpamList: (state, action: PayloadAction<SpamNumber>) => {
      const existing = state.localSpamList.findIndex(
        (s) => s.normalizedNumber === action.payload.normalizedNumber
      );

      if (existing >= 0) {
        state.localSpamList[existing] = action.payload;
      } else {
        state.localSpamList.push(action.payload);
      }
    },

    // Yerel spam listesinden kaldır
    removeFromLocalSpamList: (state, action: PayloadAction<string>) => {
      const normalizedNumber = normalizePhoneNumber(action.payload);
      state.localSpamList = state.localSpamList.filter(
        (s) => s.normalizedNumber !== normalizedNumber
      );
    },
  },
  extraReducers: (builder) => {
    // Block number
    builder.addCase(blockNumber.pending, (state) => {
      state.isLoading = true;
      state.error = undefined;
    });
    builder.addCase(blockNumber.fulfilled, (state, action) => {
      state.isLoading = false;
      state.blockedNumbers.push(action.payload);
      state.stats.totalBlocked = state.blockedNumbers.length;
    });
    builder.addCase(blockNumber.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Unblock number
    builder.addCase(unblockNumber.pending, (state) => {
      state.isLoading = true;
      state.error = undefined;
    });
    builder.addCase(unblockNumber.fulfilled, (state, action) => {
      state.isLoading = false;
      const normalizedNumber = normalizePhoneNumber(action.payload);
      state.blockedNumbers = state.blockedNumbers.filter(
        (b) => b.normalizedNumber !== normalizedNumber
      );
      state.stats.totalBlocked = state.blockedNumbers.length;
    });
    builder.addCase(unblockNumber.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Report spam
    builder.addCase(reportSpam.pending, (state) => {
      state.isLoading = true;
      state.error = undefined;
    });
    builder.addCase(reportSpam.fulfilled, (state, action) => {
      state.isLoading = false;
      state.pendingReports.push(action.payload);
      state.stats.reportsSubmitted += 1;
    });
    builder.addCase(reportSpam.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Check spam
    builder.addCase(checkSpam.fulfilled, (state, action) => {
      const result = action.payload;
      const normalizedNumber = normalizePhoneNumber(result.phoneNumber);
      state.spamCheckCache[normalizedNumber] = result;

      if (result.isSpam) {
        state.stats.spamDetected += 1;
      }
    });

    // Sync with system
    builder.addCase(syncWithSystem.pending, (state) => {
      state.isSyncing = true;
    });
    builder.addCase(syncWithSystem.fulfilled, (state, action) => {
      state.isSyncing = false;
      // Sistem engelli numaralarını işle
      // action.payload içinde sistem numaraları var
    });
    builder.addCase(syncWithSystem.rejected, (state, action) => {
      state.isSyncing = false;
      state.error = action.payload as string;
    });

    // Sync with cloud
    builder.addCase(syncWithCloud.pending, (state) => {
      state.isSyncing = true;
    });
    builder.addCase(syncWithCloud.fulfilled, (state, action) => {
      state.isSyncing = false;
      state.localSpamList = action.payload.spamList;
      state.lastSyncAt = action.payload.syncedAt;
    });
    builder.addCase(syncWithCloud.rejected, (state, action) => {
      state.isSyncing = false;
      state.error = action.payload as string;
    });

    // Submit pending reports
    builder.addCase(submitPendingReports.fulfilled, (state, action) => {
      const submittedIds = action.payload;
      state.pendingReports = state.pendingReports.filter(
        (r) => !submittedIds.includes(r.id)
      );
    });
  },
});

// ==================== Actions ====================

export const {
  muteContact,
  unmuteContact,
  recordBlockedCall,
  updateSettings,
  updateSpamCache,
  clearSpamCache,
  resetDailyStats,
  clearError,
  addToLocalSpamList,
  removeFromLocalSpamList,
} = blockingSlice.actions;

// ==================== Selectors ====================

export const selectBlockedNumbers = (state: RootState) => state.blocking.blockedNumbers;

export const selectMutedContacts = (state: RootState) => state.blocking.mutedContacts;

export const selectBlockingSettings = (state: RootState) => state.blocking.settings;

export const selectBlockingStats = (state: RootState) => state.blocking.stats;

export const selectIsNumberBlocked = (state: RootState, phoneNumber: string) => {
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  return state.blocking.blockedNumbers.some(
    (b) => b.normalizedNumber === normalizedNumber
  );
};

export const selectIsContactMuted = (state: RootState, phoneNumber: string) => {
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  return state.blocking.mutedContacts.some(
    (m) => m.normalizedNumber === normalizedNumber
  );
};

export const selectSpamCheckResult = (state: RootState, phoneNumber: string) => {
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  return state.blocking.spamCheckCache[normalizedNumber];
};

export const selectPendingReportsCount = (state: RootState) =>
  state.blocking.pendingReports.length;

export const selectBlockedByReason = (state: RootState, reason: BlockReason) =>
  state.blocking.blockedNumbers.filter((b) => b.reason === reason);

export const selectRecentlyBlocked = (state: RootState, days: number = 7) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return state.blocking.blockedNumbers.filter(
    (b) => new Date(b.blockedAt) > cutoff
  );
};

export const selectMostAttemptedBlocked = (state: RootState, limit: number = 10) =>
  [...state.blocking.blockedNumbers]
    .sort((a, b) => b.callAttempts - a.callAttempts)
    .slice(0, limit);

// ==================== Helper Functions ====================

/**
 * Telefon numarasını normalize et (E.164 formatına)
 */
function normalizePhoneNumber(phoneNumber: string): string {
  // Sadece rakamları al
  let digits = phoneNumber.replace(/\D/g, '');

  // Türkiye numarası kontrolü
  if (digits.startsWith('0') && digits.length === 11) {
    // 05xx... -> +905xx...
    digits = '90' + digits.substring(1);
  } else if (digits.length === 10 && digits.startsWith('5')) {
    // 5xx... -> +905xx...
    digits = '90' + digits;
  }

  // + ile başlat
  if (!digits.startsWith('+')) {
    digits = '+' + digits;
  }

  return digits;
}

/**
 * Son kontrol yeterince güncel mi?
 */
function isRecentCheck(checkedAt: string, maxAgeMinutes: number = 60): boolean {
  const checkTime = new Date(checkedAt).getTime();
  const now = Date.now();
  return now - checkTime < maxAgeMinutes * 60 * 1000;
}

export default blockingSlice.reducer;
