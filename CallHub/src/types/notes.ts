/**
 * LifeCall - Notlar Modülü Tipleri
 *
 * Zengin metin notları için tip tanımları:
 * - Zengin metin içeriği
 * - Kişi entegrasyonu
 * - Takvim entegrasyonu
 * - Konum
 * - Hatırlatıcılar
 * - Etiketler/Kategoriler
 */

// ============================================
// ANA TİPLER
// ============================================

/**
 * Not renkleri
 */
export type NoteColor =
  | 'default'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink';

/**
 * Not renk değerleri
 */
export const NOTE_COLORS: Record<NoteColor, string> = {
  default: '#FFFFFF',
  red: '#FFCDD2',
  orange: '#FFE0B2',
  yellow: '#FFF9C4',
  green: '#C8E6C9',
  teal: '#B2DFDB',
  blue: '#BBDEFB',
  purple: '#E1BEE7',
  pink: '#F8BBD9',
};

/**
 * Karanlık tema not renkleri
 */
export const NOTE_COLORS_DARK: Record<NoteColor, string> = {
  default: '#1E1E1E',
  red: '#5C2121',
  orange: '#5C3D21',
  yellow: '#5C5321',
  green: '#215C2E',
  teal: '#215C52',
  blue: '#21425C',
  purple: '#3D215C',
  pink: '#5C2149',
};

/**
 * Not tipi
 */
export type NoteType = 'text' | 'checklist' | 'voice';

/**
 * Not önceliği
 */
export type NotePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Zengin metin blok tipleri
 */
export type RichTextBlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'checklist'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image';

/**
 * Metin stil tipi
 */
export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  highlight?: string;
  link?: string;
}

/**
 * Zengin metin bloğu
 */
export interface RichTextBlock {
  id: string;
  type: RichTextBlockType;
  content: string;
  style?: TextStyle;
  checked?: boolean; // checklist için
  level?: number; // heading için
  imageUri?: string; // image için
}

/**
 * Kontrol listesi öğesi
 */
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  createdAt: string;
  completedAt?: string;
}

/**
 * Not hatırlatıcısı
 */
export interface NoteReminder {
  id: string;
  dateTime: string;
  type: 'notification' | 'alarm';
  isEnabled: boolean;
  ringtoneUri?: string;
}

/**
 * Not konumu
 */
export interface NoteLocation {
  address?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Not eki
 */
export interface NoteAttachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  duration?: number; // ses için (saniye)
  createdAt: string;
}

/**
 * Ana not tipi
 */
export interface Note {
  id: string;
  title: string;
  content: string; // Düz metin içerik
  richContent?: RichTextBlock[]; // Zengin metin bloklarý
  type: NoteType;
  color: NoteColor;
  priority: NotePriority;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;

  // Checklist
  checklistItems?: ChecklistItem[];

  // Sesli not
  voiceRecordingUri?: string;
  voiceDuration?: number;

  // Bağlantılar
  linkedContactIds?: string[];
  linkedEventIds?: string[];
  linkedCallIds?: string[];

  // Konum
  location?: NoteLocation;

  // Hatırlatıcılar
  reminders?: NoteReminder[];

  // Ekler
  attachments?: NoteAttachment[];

  // Etiketler
  tags?: string[];
  folderId?: string;

  // Zaman damgaları
  createdAt: string;
  updatedAt: string;
  trashedAt?: string;
  reminderAt?: string;
}

/**
 * Not klasörü
 */
export interface NoteFolder {
  id: string;
  name: string;
  color?: NoteColor;
  icon?: string;
  parentId?: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Etiket
 */
export interface NoteTag {
  id: string;
  name: string;
  color?: string;
  noteCount: number;
}

// ============================================
// AYARLAR
// ============================================

/**
 * Not ayarları
 */
export interface NotesSettings {
  defaultNoteType: NoteType;
  defaultColor: NoteColor;
  defaultPriority: NotePriority;
  showPreview: boolean;
  previewLines: number;
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'color';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  autoSave: boolean;
  autoSaveInterval: number; // saniye
  trashRetentionDays: number;
  defaultReminderTime: string; // "09:00" formatında
  enableRichText: boolean;
}

/**
 * Varsayılan not ayarları
 */
export const DEFAULT_NOTES_SETTINGS: NotesSettings = {
  defaultNoteType: 'text',
  defaultColor: 'default',
  defaultPriority: 'normal',
  showPreview: true,
  previewLines: 2,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  viewMode: 'grid',
  autoSave: true,
  autoSaveInterval: 5,
  trashRetentionDays: 30,
  defaultReminderTime: '09:00',
  enableRichText: true,
};

// ============================================
// STATE
// ============================================

/**
 * Notlar Redux state
 */
export interface NotesState {
  // Veriler
  notes: Note[];
  folders: NoteFolder[];
  tags: NoteTag[];

  // UI state
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  selectedTagId: string | null;
  searchQuery: string;
  filterType: NoteType | 'all';
  showArchived: boolean;
  showTrashed: boolean;

  // Ayarlar
  settings: NotesSettings;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Error
  error: string | null;
}

// ============================================
// PAYLOAD TİPLERİ
// ============================================

/**
 * Not oluşturma payload
 */
export interface CreateNotePayload {
  title?: string;
  content?: string;
  richContent?: RichTextBlock[];
  type?: NoteType;
  color?: NoteColor;
  priority?: NotePriority;
  checklistItems?: Omit<ChecklistItem, 'id' | 'createdAt'>[];
  linkedContactIds?: string[];
  linkedEventIds?: string[];
  linkedCallIds?: string[];
  location?: NoteLocation;
  reminders?: Omit<NoteReminder, 'id'>[];
  tags?: string[];
  folderId?: string;
}

/**
 * Not güncelleme payload
 */
export interface UpdateNotePayload {
  id: string;
  updates: Partial<Omit<Note, 'id' | 'createdAt'>>;
}

/**
 * Klasör oluşturma payload
 */
export interface CreateFolderPayload {
  name: string;
  color?: NoteColor;
  icon?: string;
  parentId?: string;
}

// ============================================
// YARDIMCI TİPLER
// ============================================

/**
 * Not özeti (liste görünümü için)
 */
export interface NoteSummary {
  id: string;
  title: string;
  preview: string;
  type: NoteType;
  color: NoteColor;
  priority: NotePriority;
  isPinned: boolean;
  hasReminder: boolean;
  hasAttachments: boolean;
  hasLocation: boolean;
  linkedContactsCount: number;
  linkedEventsCount: number;
  checklistProgress?: {
    total: number;
    completed: number;
  };
  updatedAt: string;
}

/**
 * Not filtreleri
 */
export interface NoteFilters {
  type?: NoteType | 'all';
  color?: NoteColor;
  priority?: NotePriority;
  tags?: string[];
  folderId?: string | null;
  hasReminder?: boolean;
  hasAttachments?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Not sıralama seçenekleri
 */
export interface NoteSortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'color';
  order: 'asc' | 'desc';
}

// ============================================
// SABİTLER
// ============================================

/**
 * Öncelik seçenekleri
 */
export const PRIORITY_OPTIONS: { value: NotePriority; labelKey: string; color: string }[] = [
  { value: 'low', labelKey: 'low', color: '#9E9E9E' },
  { value: 'normal', labelKey: 'normal', color: '#2196F3' },
  { value: 'high', labelKey: 'high', color: '#FF9800' },
  { value: 'urgent', labelKey: 'urgent', color: '#F44336' },
];

/**
 * Sıralama seçenekleri
 */
export const SORT_OPTIONS: { value: NotesSettings['sortBy']; labelKey: string }[] = [
  { value: 'updatedAt', labelKey: 'lastModified' },
  { value: 'createdAt', labelKey: 'created' },
  { value: 'title', labelKey: 'title' },
  { value: 'priority', labelKey: 'priority' },
  { value: 'color', labelKey: 'color' },
];

/**
 * Varsayılan yerel klasör
 */
export const DEFAULT_LOCAL_FOLDER: NoteFolder = {
  id: 'all',
  name: 'All Notes',
  noteCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Varsayılan arşiv klasörü
 */
export const ARCHIVE_FOLDER: NoteFolder = {
  id: 'archive',
  name: 'Archive',
  icon: 'archive',
  noteCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Varsayılan çöp kutusu klasörü
 */
export const TRASH_FOLDER: NoteFolder = {
  id: 'trash',
  name: 'Trash',
  icon: 'delete',
  noteCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
