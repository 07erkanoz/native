/**
 * LifeCall - Contacts Slice
 *
 * Kişiler state yönetimi
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Contact, DeviceAccount } from '../../types';

// State tipi
interface ContactsState {
  contacts: Contact[];
  accounts: DeviceAccount[];
  selectedAccountIds: string[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  lastSyncTime: string | null;
}

// Başlangıç state
const initialState: ContactsState = {
  contacts: [],
  accounts: [],
  selectedAccountIds: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  lastSyncTime: null,
};

// Async thunks - Placeholder, gerçek implementasyon daha sonra
export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement native module integration
      return [] as Contact[];
    } catch (error) {
      return rejectWithValue('Kişiler yüklenemedi');
    }
  }
);

export const fetchAccounts = createAsyncThunk(
  'contacts/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement native module integration
      return [] as DeviceAccount[];
    } catch (error) {
      return rejectWithValue('Hesaplar yüklenemedi');
    }
  }
);

// Slice
const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedAccounts: (state, action: PayloadAction<string[]>) => {
      state.selectedAccountIds = action.payload;
    },
    toggleAccountSelection: (state, action: PayloadAction<string>) => {
      const accountId = action.payload;
      const index = state.selectedAccountIds.indexOf(accountId);
      if (index > -1) {
        state.selectedAccountIds.splice(index, 1);
      } else {
        state.selectedAccountIds.push(accountId);
      }
    },
    clearContacts: (state) => {
      state.contacts = [];
      state.lastSyncTime = null;
    },
  },
  extraReducers: (builder) => {
    // fetchContacts
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = action.payload;
        state.lastSyncTime = new Date().toISOString();
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetchAccounts
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        // Varsayılan olarak tüm hesapları seç
        if (state.selectedAccountIds.length === 0) {
          state.selectedAccountIds = action.payload.map((a) => a.id);
        }
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSearchQuery,
  setSelectedAccounts,
  toggleAccountSelection,
  clearContacts,
} = contactsSlice.actions;

export default contactsSlice.reducer;
