/**
 * LifeCall - Notes Redux Slice
 *
 * Not verilerini ve durumunu yönetir
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import uuid from 'react-native-uuid';

import {
  NotesState,
  Note,
  NoteFolder,
  NoteTag,
  NoteType,
  NoteColor,
  NotePriority,
  NotesSettings,
  CreateNotePayload,
  UpdateNotePayload,
  CreateFolderPayload,
  ChecklistItem,
  NoteReminder,
  DEFAULT_NOTES_SETTINGS,
  DEFAULT_LOCAL_FOLDER,
} from '../../types/notes';

// ============================================
// INITIAL STATE
// ============================================

const initialState: NotesState = {
  // Veriler
  notes: [],
  folders: [DEFAULT_LOCAL_FOLDER],
  tags: [],

  // UI state
  selectedNoteId: null,
  selectedFolderId: null,
  selectedTagId: null,
  searchQuery: '',
  filterType: 'all',
  showArchived: false,
  showTrashed: false,

  // Ayarlar
  settings: DEFAULT_NOTES_SETTINGS,

  // Loading states
  isLoading: false,
  isSaving: false,

  // Error
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Notları yükle
 */
export const loadNotes = createAsyncThunk(
  'notes/loadNotes',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: AsyncStorage veya veritabanından notları yükle
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Notu dışa aktar
 */
export const exportNote = createAsyncThunk(
  'notes/exportNote',
  async (noteId: string, { getState, rejectWithValue }) => {
    try {
      // TODO: Notu dosya olarak dışa aktar
      return { success: true };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Notu paylaş
 */
export const shareNote = createAsyncThunk(
  'notes/shareNote',
  async (noteId: string, { getState, rejectWithValue }) => {
    try {
      // TODO: Native share API ile notu paylaş
      return { success: true };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    // ==========================================
    // NOT İŞLEMLERİ
    // ==========================================

    /**
     * Yeni not oluştur
     */
    createNote: (state, action: PayloadAction<CreateNotePayload>) => {
      const payload = action.payload;
      const now = new Date().toISOString();

      // Checklist öğelerini oluştur
      const checklistItems: ChecklistItem[] | undefined = payload.checklistItems?.map((item) => ({
        ...item,
        id: uuid.v4() as string,
        createdAt: now,
        checked: item.checked || false,
      }));

      // Hatırlatıcıları oluştur
      const reminders: NoteReminder[] | undefined = payload.reminders?.map((reminder) => ({
        ...reminder,
        id: uuid.v4() as string,
      }));

      const newNote: Note = {
        id: uuid.v4() as string,
        title: payload.title || '',
        content: payload.content || '',
        richContent: payload.richContent,
        type: payload.type || state.settings.defaultNoteType,
        color: payload.color || state.settings.defaultColor,
        priority: payload.priority || state.settings.defaultPriority,
        isPinned: false,
        isArchived: false,
        isTrashed: false,
        checklistItems,
        linkedContactIds: payload.linkedContactIds,
        linkedEventIds: payload.linkedEventIds,
        linkedCallIds: payload.linkedCallIds,
        location: payload.location,
        reminders,
        tags: payload.tags,
        folderId: payload.folderId,
        createdAt: now,
        updatedAt: now,
      };

      state.notes.unshift(newNote);
      state.selectedNoteId = newNote.id;
    },

    /**
     * Not güncelle
     */
    updateNote: (state, action: PayloadAction<UpdateNotePayload>) => {
      const { id, updates } = action.payload;
      const index = state.notes.findIndex((n) => n.id === id);

      if (index !== -1) {
        state.notes[index] = {
          ...state.notes[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    /**
     * Not sil (çöp kutusuna taşı)
     */
    trashNote: (state, action: PayloadAction<string>) => {
      const noteId = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        note.isTrashed = true;
        note.trashedAt = new Date().toISOString();
        note.updatedAt = new Date().toISOString();
      }

      if (state.selectedNoteId === noteId) {
        state.selectedNoteId = null;
      }
    },

    /**
     * Notu geri yükle
     */
    restoreNote: (state, action: PayloadAction<string>) => {
      const noteId = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        note.isTrashed = false;
        note.trashedAt = undefined;
        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Notu kalıcı olarak sil
     */
    deleteNotePermanently: (state, action: PayloadAction<string>) => {
      const noteId = action.payload;
      state.notes = state.notes.filter((n) => n.id !== noteId);

      if (state.selectedNoteId === noteId) {
        state.selectedNoteId = null;
      }
    },

    /**
     * Çöp kutusunu boşalt
     */
    emptyTrash: (state) => {
      state.notes = state.notes.filter((n) => !n.isTrashed);
    },

    /**
     * Notu arşivle/arşivden çıkar
     */
    toggleArchive: (state, action: PayloadAction<string>) => {
      const noteId = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        note.isArchived = !note.isArchived;
        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Notu sabitle/sabitlemesini kaldır
     */
    togglePin: (state, action: PayloadAction<string>) => {
      const noteId = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        note.isPinned = !note.isPinned;
        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Not rengini değiştir
     */
    changeNoteColor: (state, action: PayloadAction<{ noteId: string; color: NoteColor }>) => {
      const { noteId, color } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        note.color = color;
        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Not önceliğini değiştir
     */
    changeNotePriority: (state, action: PayloadAction<{ noteId: string; priority: NotePriority }>) => {
      const { noteId, priority } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        note.priority = priority;
        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Not seç
     */
    selectNote: (state, action: PayloadAction<string | null>) => {
      state.selectedNoteId = action.payload;
    },

    // ==========================================
    // CHECKLIST İŞLEMLERİ
    // ==========================================

    /**
     * Checklist öğesi ekle
     */
    addChecklistItem: (state, action: PayloadAction<{ noteId: string; text: string }>) => {
      const { noteId, text } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        if (!note.checklistItems) {
          note.checklistItems = [];
        }

        note.checklistItems.push({
          id: uuid.v4() as string,
          text,
          checked: false,
          createdAt: new Date().toISOString(),
        });

        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Checklist öğesini işaretle/işareti kaldır
     */
    toggleChecklistItem: (state, action: PayloadAction<{ noteId: string; itemId: string }>) => {
      const { noteId, itemId } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note && note.checklistItems) {
        const item = note.checklistItems.find((i) => i.id === itemId);
        if (item) {
          item.checked = !item.checked;
          item.completedAt = item.checked ? new Date().toISOString() : undefined;
        }
        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Checklist öğesini güncelle
     */
    updateChecklistItem: (
      state,
      action: PayloadAction<{ noteId: string; itemId: string; text: string }>
    ) => {
      const { noteId, itemId, text } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note && note.checklistItems) {
        const item = note.checklistItems.find((i) => i.id === itemId);
        if (item) {
          item.text = text;
        }
        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Checklist öğesini sil
     */
    deleteChecklistItem: (state, action: PayloadAction<{ noteId: string; itemId: string }>) => {
      const { noteId, itemId } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note && note.checklistItems) {
        note.checklistItems = note.checklistItems.filter((i) => i.id !== itemId);
        note.updatedAt = new Date().toISOString();
      }
    },

    // ==========================================
    // HATIRLATICI İŞLEMLERİ
    // ==========================================

    /**
     * Hatırlatıcı ekle
     */
    addReminder: (
      state,
      action: PayloadAction<{
        noteId: string;
        dateTime: string;
        type?: 'notification' | 'alarm';
      }>
    ) => {
      const { noteId, dateTime, type = 'notification' } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        if (!note.reminders) {
          note.reminders = [];
        }

        note.reminders.push({
          id: uuid.v4() as string,
          dateTime,
          type,
          isEnabled: true,
        });

        note.reminderAt = dateTime;
        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Hatırlatıcı sil
     */
    removeReminder: (state, action: PayloadAction<{ noteId: string; reminderId: string }>) => {
      const { noteId, reminderId } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note && note.reminders) {
        note.reminders = note.reminders.filter((r) => r.id !== reminderId);
        note.reminderAt = note.reminders[0]?.dateTime;
        note.updatedAt = new Date().toISOString();
      }
    },

    // ==========================================
    // BAĞLANTI İŞLEMLERİ
    // ==========================================

    /**
     * Kişi bağla
     */
    linkContact: (state, action: PayloadAction<{ noteId: string; contactId: string }>) => {
      const { noteId, contactId } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        if (!note.linkedContactIds) {
          note.linkedContactIds = [];
        }

        if (!note.linkedContactIds.includes(contactId)) {
          note.linkedContactIds.push(contactId);
          note.updatedAt = new Date().toISOString();
        }
      }
    },

    /**
     * Kişi bağlantısını kaldır
     */
    unlinkContact: (state, action: PayloadAction<{ noteId: string; contactId: string }>) => {
      const { noteId, contactId } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note && note.linkedContactIds) {
        note.linkedContactIds = note.linkedContactIds.filter((id) => id !== contactId);
        note.updatedAt = new Date().toISOString();
      }
    },

    /**
     * Etkinlik bağla
     */
    linkEvent: (state, action: PayloadAction<{ noteId: string; eventId: string }>) => {
      const { noteId, eventId } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        if (!note.linkedEventIds) {
          note.linkedEventIds = [];
        }

        if (!note.linkedEventIds.includes(eventId)) {
          note.linkedEventIds.push(eventId);
          note.updatedAt = new Date().toISOString();
        }
      }
    },

    /**
     * Etkinlik bağlantısını kaldır
     */
    unlinkEvent: (state, action: PayloadAction<{ noteId: string; eventId: string }>) => {
      const { noteId, eventId } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note && note.linkedEventIds) {
        note.linkedEventIds = note.linkedEventIds.filter((id) => id !== eventId);
        note.updatedAt = new Date().toISOString();
      }
    },

    // ==========================================
    // KLASÖR İŞLEMLERİ
    // ==========================================

    /**
     * Klasör oluştur
     */
    createFolder: (state, action: PayloadAction<CreateFolderPayload>) => {
      const payload = action.payload;
      const now = new Date().toISOString();

      const newFolder: NoteFolder = {
        id: uuid.v4() as string,
        name: payload.name,
        color: payload.color,
        icon: payload.icon,
        parentId: payload.parentId,
        noteCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      state.folders.push(newFolder);
    },

    /**
     * Klasör güncelle
     */
    updateFolder: (state, action: PayloadAction<{ id: string; updates: Partial<NoteFolder> }>) => {
      const { id, updates } = action.payload;
      const index = state.folders.findIndex((f) => f.id === id);

      if (index !== -1) {
        state.folders[index] = {
          ...state.folders[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    /**
     * Klasör sil
     */
    deleteFolder: (state, action: PayloadAction<string>) => {
      const folderId = action.payload;

      // Sistem klasörleri silinemez
      if (['all', 'archive', 'trash'].includes(folderId)) return;

      state.folders = state.folders.filter((f) => f.id !== folderId);

      // Bu klasördeki notları "all" klasörüne taşı
      state.notes.forEach((note) => {
        if (note.folderId === folderId) {
          note.folderId = undefined;
        }
      });

      if (state.selectedFolderId === folderId) {
        state.selectedFolderId = null;
      }
    },

    /**
     * Klasör seç
     */
    selectFolder: (state, action: PayloadAction<string | null>) => {
      state.selectedFolderId = action.payload;
    },

    // ==========================================
    // ETİKET İŞLEMLERİ
    // ==========================================

    /**
     * Etiket oluştur
     */
    createTag: (state, action: PayloadAction<{ name: string; color?: string }>) => {
      const { name, color } = action.payload;

      // Aynı isimde etiket varsa ekleme
      if (state.tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
        return;
      }

      const newTag: NoteTag = {
        id: uuid.v4() as string,
        name,
        color,
        noteCount: 0,
      };

      state.tags.push(newTag);
    },

    /**
     * Etiket sil
     */
    deleteTag: (state, action: PayloadAction<string>) => {
      const tagId = action.payload;
      const tag = state.tags.find((t) => t.id === tagId);

      if (tag) {
        // Bu etiketi kullanan notlardan kaldır
        state.notes.forEach((note) => {
          if (note.tags) {
            note.tags = note.tags.filter((t) => t !== tag.name);
          }
        });

        state.tags = state.tags.filter((t) => t.id !== tagId);
      }
    },

    /**
     * Nota etiket ekle
     */
    addTagToNote: (state, action: PayloadAction<{ noteId: string; tagName: string }>) => {
      const { noteId, tagName } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note) {
        if (!note.tags) {
          note.tags = [];
        }

        if (!note.tags.includes(tagName)) {
          note.tags.push(tagName);
          note.updatedAt = new Date().toISOString();

          // Etiket sayısını güncelle
          const tag = state.tags.find((t) => t.name === tagName);
          if (tag) {
            tag.noteCount++;
          }
        }
      }
    },

    /**
     * Nottan etiket kaldır
     */
    removeTagFromNote: (state, action: PayloadAction<{ noteId: string; tagName: string }>) => {
      const { noteId, tagName } = action.payload;
      const note = state.notes.find((n) => n.id === noteId);

      if (note && note.tags) {
        note.tags = note.tags.filter((t) => t !== tagName);
        note.updatedAt = new Date().toISOString();

        // Etiket sayısını güncelle
        const tag = state.tags.find((t) => t.name === tagName);
        if (tag && tag.noteCount > 0) {
          tag.noteCount--;
        }
      }
    },

    /**
     * Etiket seç
     */
    selectTag: (state, action: PayloadAction<string | null>) => {
      state.selectedTagId = action.payload;
    },

    // ==========================================
    // UI İŞLEMLERİ
    // ==========================================

    /**
     * Arama sorgusunu ayarla
     */
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    /**
     * Filtre tipini ayarla
     */
    setFilterType: (state, action: PayloadAction<NoteType | 'all'>) => {
      state.filterType = action.payload;
    },

    /**
     * Arşivleri göster/gizle
     */
    toggleShowArchived: (state) => {
      state.showArchived = !state.showArchived;
    },

    /**
     * Çöp kutusunu göster/gizle
     */
    toggleShowTrashed: (state) => {
      state.showTrashed = !state.showTrashed;
    },

    // ==========================================
    // AYARLAR
    // ==========================================

    /**
     * Ayarları güncelle
     */
    updateSettings: (state, action: PayloadAction<Partial<NotesSettings>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    /**
     * Ayarları sıfırla
     */
    resetSettings: (state) => {
      state.settings = DEFAULT_NOTES_SETTINGS;
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
    resetNotesState: () => initialState,
  },

  extraReducers: (builder) => {
    // loadNotes
    builder
      .addCase(loadNotes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadNotes.fulfilled, (state, action) => {
        state.isLoading = false;
        // state.notes = action.payload;
      })
      .addCase(loadNotes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // exportNote
    builder
      .addCase(exportNote.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(exportNote.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(exportNote.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });

    // shareNote
    builder
      .addCase(shareNote.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(shareNote.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(shareNote.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================
// SELECTORS
// ============================================

/**
 * Filtrelenmiş notları al
 */
export const selectFilteredNotes = (state: { notes: NotesState }) => {
  let notes = state.notes.notes;

  // Çöp kutusu gösterimi
  if (state.notes.showTrashed) {
    return notes.filter((n) => n.isTrashed);
  }

  // Çöpteki notları hariç tut
  notes = notes.filter((n) => !n.isTrashed);

  // Arşivleri filtrele
  if (!state.notes.showArchived) {
    notes = notes.filter((n) => !n.isArchived);
  }

  // Klasör filtresi
  if (state.notes.selectedFolderId && state.notes.selectedFolderId !== 'all') {
    if (state.notes.selectedFolderId === 'archive') {
      notes = notes.filter((n) => n.isArchived);
    } else {
      notes = notes.filter((n) => n.folderId === state.notes.selectedFolderId);
    }
  }

  // Etiket filtresi
  if (state.notes.selectedTagId) {
    const tag = state.notes.tags.find((t) => t.id === state.notes.selectedTagId);
    if (tag) {
      notes = notes.filter((n) => n.tags?.includes(tag.name));
    }
  }

  // Tip filtresi
  if (state.notes.filterType !== 'all') {
    notes = notes.filter((n) => n.type === state.notes.filterType);
  }

  // Arama filtresi
  if (state.notes.searchQuery) {
    const query = state.notes.searchQuery.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags?.some((t) => t.toLowerCase().includes(query))
    );
  }

  // Sıralama
  const { sortBy, sortOrder } = state.notes.settings;
  notes = [...notes].sort((a, b) => {
    // Sabitlenmiş notlar her zaman üstte
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    let comparison = 0;
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'color':
        comparison = a.color.localeCompare(b.color);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
      default:
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return notes;
};

/**
 * Seçili notu al
 */
export const selectSelectedNote = (state: { notes: NotesState }) => {
  if (!state.notes.selectedNoteId) return null;
  return state.notes.notes.find((n) => n.id === state.notes.selectedNoteId) || null;
};

/**
 * Kişiye bağlı notları al
 */
export const selectNotesByContact = (state: { notes: NotesState }, contactId: string) => {
  return state.notes.notes.filter(
    (n) => !n.isTrashed && n.linkedContactIds?.includes(contactId)
  );
};

/**
 * Etkinliğe bağlı notları al
 */
export const selectNotesByEvent = (state: { notes: NotesState }, eventId: string) => {
  return state.notes.notes.filter(
    (n) => !n.isTrashed && n.linkedEventIds?.includes(eventId)
  );
};

/**
 * Aramaya bağlı notları al
 */
export const selectNotesByCall = (state: { notes: NotesState }, callId: string) => {
  return state.notes.notes.filter(
    (n) => !n.isTrashed && n.linkedCallIds?.includes(callId)
  );
};

/**
 * Hatırlatıcılı notları al
 */
export const selectNotesWithReminders = (state: { notes: NotesState }) => {
  return state.notes.notes.filter(
    (n) => !n.isTrashed && n.reminders && n.reminders.length > 0 && n.reminders.some((r) => r.isEnabled)
  );
};

/**
 * Not sayılarını al
 */
export const selectNoteCounts = (state: { notes: NotesState }) => {
  const notes = state.notes.notes;
  return {
    total: notes.filter((n) => !n.isTrashed && !n.isArchived).length,
    archived: notes.filter((n) => n.isArchived && !n.isTrashed).length,
    trashed: notes.filter((n) => n.isTrashed).length,
    pinned: notes.filter((n) => n.isPinned && !n.isTrashed && !n.isArchived).length,
  };
};

// ============================================
// EXPORTS
// ============================================

export const {
  // Not işlemleri
  createNote,
  updateNote,
  trashNote,
  restoreNote,
  deleteNotePermanently,
  emptyTrash,
  toggleArchive,
  togglePin,
  changeNoteColor,
  changeNotePriority,
  selectNote,

  // Checklist işlemleri
  addChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,

  // Hatırlatıcı işlemleri
  addReminder,
  removeReminder,

  // Bağlantı işlemleri
  linkContact,
  unlinkContact,
  linkEvent,
  unlinkEvent,

  // Klasör işlemleri
  createFolder,
  updateFolder,
  deleteFolder,
  selectFolder,

  // Etiket işlemleri
  createTag,
  deleteTag,
  addTagToNote,
  removeTagFromNote,
  selectTag,

  // UI işlemleri
  setSearchQuery,
  setFilterType,
  toggleShowArchived,
  toggleShowTrashed,

  // Ayarlar
  updateSettings,
  resetSettings,

  // Hata yönetimi
  clearError,
  resetNotesState,
} = notesSlice.actions;

export default notesSlice.reducer;
