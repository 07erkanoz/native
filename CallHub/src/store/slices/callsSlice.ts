/**
 * LifeCall - Calls Slice
 *
 * Arama geçmişi state yönetimi
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CallLogEntry, CallType } from '../../types';

// State tipi
interface CallsState {
  calls: CallLogEntry[];
  isLoading: boolean;
  error: string | null;
  filterType: CallType | 'all';
  lastFetchTime: string | null;
}

// Başlangıç state
const initialState: CallsState = {
  calls: [],
  isLoading: false,
  error: null,
  filterType: 'all',
  lastFetchTime: null,
};

// Async thunks
export const fetchCallHistory = createAsyncThunk(
  'calls/fetchCallHistory',
  async (limit: number = 100, { rejectWithValue }) => {
    try {
      // TODO: Implement native module integration
      return [] as CallLogEntry[];
    } catch (error) {
      return rejectWithValue('Arama geçmişi yüklenemedi');
    }
  }
);

// Slice
const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    setFilterType: (state, action: PayloadAction<CallType | 'all'>) => {
      state.filterType = action.payload;
    },
    markCallAsRead: (state, action: PayloadAction<string>) => {
      const call = state.calls.find((c) => c.id === action.payload);
      if (call) {
        call.isRead = true;
        call.isNew = false;
      }
    },
    markAllAsRead: (state) => {
      state.calls.forEach((call) => {
        call.isRead = true;
        call.isNew = false;
      });
    },
    clearCallHistory: (state) => {
      state.calls = [];
      state.lastFetchTime = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCallHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCallHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.calls = action.payload;
        state.lastFetchTime = new Date().toISOString();
      })
      .addCase(fetchCallHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setFilterType,
  markCallAsRead,
  markAllAsRead,
  clearCallHistory,
} = callsSlice.actions;

export default callsSlice.reducer;
