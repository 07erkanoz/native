/**
 * LifeCall - Redux Store
 *
 * Redux Toolkit + Redux Persist ile state yönetimi
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Slice'lar
import contactsReducer from './slices/contactsSlice';
import callsReducer from './slices/callsSlice';
import favoritesReducer from './slices/favoritesSlice';
import settingsReducer from './slices/settingsSlice';
import calendarReducer from './slices/calendarSlice';

// Root reducer
const rootReducer = combineReducers({
  contacts: contactsReducer,
  calls: callsReducer,
  favorites: favoritesReducer,
  settings: settingsReducer,
  calendar: calendarReducer,
});

// Persist config
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['favorites', 'settings', 'calendar'], // Sadece bunlar persist edilsin
  blacklist: ['contacts', 'calls'], // Bunlar cihazdan çekilecek
};

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store oluştur
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
