/**
 * LifeCall - Favorites Slice
 *
 * Favoriler state yönetimi
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FavoriteContact } from '../../types';

// View mode
type ViewMode = 'grid' | 'list';

// Grid boyutu
type GridSize = 'small' | 'medium' | 'large';

// State tipi
interface FavoritesState {
  favorites: FavoriteContact[];
  viewMode: ViewMode;
  gridSize: GridSize;
  isEditMode: boolean;
}

// Başlangıç state
const initialState: FavoritesState = {
  favorites: [],
  viewMode: 'grid',
  gridSize: 'medium',
  isEditMode: false,
};

// Slice
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavorite: (state, action: PayloadAction<FavoriteContact>) => {
      // En sona ekle
      const maxOrder = Math.max(0, ...state.favorites.map((f) => f.sortOrder));
      state.favorites.push({
        ...action.payload,
        sortOrder: maxOrder + 1,
      });
    },
    removeFavorite: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(
        (f) => f.contactId !== action.payload
      );
    },
    reorderFavorites: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) => {
      const { fromIndex, toIndex } = action.payload;
      const [removed] = state.favorites.splice(fromIndex, 1);
      state.favorites.splice(toIndex, 0, removed);
      // Sıralama güncellemesi
      state.favorites.forEach((f, index) => {
        f.sortOrder = index;
      });
    },
    setFavorites: (state, action: PayloadAction<FavoriteContact[]>) => {
      state.favorites = action.payload;
    },
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    setGridSize: (state, action: PayloadAction<GridSize>) => {
      state.gridSize = action.payload;
    },
    toggleEditMode: (state) => {
      state.isEditMode = !state.isEditMode;
    },
    setEditMode: (state, action: PayloadAction<boolean>) => {
      state.isEditMode = action.payload;
    },
  },
});

export const {
  addFavorite,
  removeFavorite,
  reorderFavorites,
  setFavorites,
  setViewMode,
  setGridSize,
  toggleEditMode,
  setEditMode,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
