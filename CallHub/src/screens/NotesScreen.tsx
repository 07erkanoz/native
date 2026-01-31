/**
 * LifeCall - Notlar Ekranı
 *
 * Ana notlar görünümü:
 * - Grid/Liste görünümü
 * - Klasörler
 * - Arama ve filtreleme
 * - Sabitlenen notlar
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Text,
  FAB,
  Searchbar,
  IconButton,
  Surface,
  Chip,
  Menu,
  Portal,
  Modal,
  Button,
  SegmentedButtons,
  Divider,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { tr, enUS, de, fr, es, ru, ar } from 'date-fns/locale';

import { useAppTheme } from '../theme';
import { RootState, AppDispatch } from '../store';
import {
  setSearchQuery,
  setFilterType,
  setSelectedFolderId,
  selectFilteredNotes,
  togglePin,
  trashNote,
  updateSettings,
} from '../store/slices/notesSlice';
import {
  Note,
  NoteType,
  NoteColor,
  NOTE_COLORS,
  NOTE_COLORS_DARK,
  NoteFolder,
  PRIORITY_OPTIONS,
} from '../types/notes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 2;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48) / GRID_COLUMNS;

// Locale mapping
const LOCALES: Record<string, Locale> = {
  tr: tr,
  en: enUS,
  de: de,
  fr: fr,
  es: es,
  ru: ru,
  ar: ar,
};

const NotesScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const {
    folders,
    tags,
    selectedFolderId,
    searchQuery,
    filterType,
    showArchived,
    showTrashed,
    settings,
    isLoading,
  } = useSelector((state: RootState) => state.notes);
  const filteredNotes = useSelector(selectFilteredNotes);

  // Local state
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Locale
  const locale = LOCALES[i18n.language] || enUS;

  // Note colors
  const noteColors = isDark ? NOTE_COLORS_DARK : NOTE_COLORS;

  // Grouped notes (pinned first)
  const groupedNotes = useMemo(() => {
    const pinned = filteredNotes.filter((note) => note.isPinned);
    const unpinned = filteredNotes.filter((note) => !note.isPinned);
    return { pinned, unpinned };
  }, [filteredNotes]);

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  // Handle filter type change
  const handleFilterTypeChange = useCallback(
    (type: NoteType | 'all') => {
      dispatch(setFilterType(type));
      setFilterMenuVisible(false);
    },
    [dispatch]
  );

  // Handle folder select
  const handleFolderSelect = useCallback(
    (folderId: string | null) => {
      dispatch(setSelectedFolderId(folderId));
      setFolderModalVisible(false);
    },
    [dispatch]
  );

  // Handle view mode toggle
  const handleViewModeToggle = useCallback(() => {
    dispatch(
      updateSettings({
        viewMode: settings.viewMode === 'grid' ? 'list' : 'grid',
      })
    );
  }, [dispatch, settings.viewMode]);

  // Handle sort change
  const handleSortChange = useCallback(
    (sortBy: typeof settings.sortBy) => {
      dispatch(updateSettings({ sortBy }));
      setSortMenuVisible(false);
    },
    [dispatch]
  );

  // Handle note press
  const handleNotePress = useCallback(
    (note: Note) => {
      navigation.navigate('NoteDetail' as never, { noteId: note.id } as never);
    },
    [navigation]
  );

  // Handle note long press
  const handleNoteLongPress = useCallback(
    (note: Note) => {
      dispatch(togglePin(note.id));
    },
    [dispatch]
  );

  // Handle add note
  const handleAddNote = useCallback(() => {
    navigation.navigate('NoteEdit' as never);
  }, [navigation]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simüle edilmiş yenileme
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Get note preview
  const getNotePreview = useCallback(
    (note: Note): string => {
      if (note.type === 'checklist' && note.checklistItems) {
        const completed = note.checklistItems.filter((item) => item.checked).length;
        const total = note.checklistItems.length;
        return `${completed}/${total} ${t('notes.completed')}`;
      }
      if (note.type === 'voice') {
        return t('notes.voiceNote');
      }
      return note.content.substring(0, 100) || t('notes.emptyNote');
    },
    [t]
  );

  // Format date
  const formatNoteDate = useCallback(
    (dateStr: string) => {
      const date = parseISO(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 1) {
        return formatDistanceToNow(date, { addSuffix: true, locale });
      } else if (diffDays < 7) {
        return format(date, 'EEEE', { locale });
      } else {
        return format(date, 'd MMM', { locale });
      }
    },
    [locale]
  );

  // Get priority color
  const getPriorityColor = useCallback((priority: Note['priority']) => {
    const option = PRIORITY_OPTIONS.find((p) => p.value === priority);
    return option?.color || '#2196F3';
  }, []);

  // Render note card (grid)
  const renderNoteCardGrid = useCallback(
    (note: Note) => {
      const backgroundColor = noteColors[note.color];
      const hasReminder = note.reminders && note.reminders.length > 0;
      const hasLocation = !!note.location;
      const hasLinks = (note.linkedContactIds?.length || 0) + (note.linkedEventIds?.length || 0) > 0;

      return (
        <TouchableOpacity
          style={[styles.noteCardGrid, { backgroundColor }]}
          onPress={() => handleNotePress(note)}
          onLongPress={() => handleNoteLongPress(note)}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.noteCardHeader}>
            {note.isPinned && (
              <MaterialCommunityIcons
                name="pin"
                size={16}
                color={theme.colors.primary}
                style={styles.pinIcon}
              />
            )}
            {note.priority !== 'normal' && (
              <View
                style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor(note.priority) },
                ]}
              />
            )}
          </View>

          {/* Title */}
          {note.title && (
            <Text
              variant="titleSmall"
              style={[styles.noteTitle, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {note.title}
            </Text>
          )}

          {/* Content preview */}
          <Text
            variant="bodySmall"
            style={[styles.notePreview, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={settings.previewLines}
          >
            {getNotePreview(note)}
          </Text>

          {/* Checklist progress */}
          {note.type === 'checklist' && note.checklistItems && note.checklistItems.length > 0 && (
            <View style={styles.checklistProgress}>
              <View
                style={[
                  styles.checklistProgressBar,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <View
                  style={[
                    styles.checklistProgressFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${(note.checklistItems.filter((i) => i.checked).length / note.checklistItems.length) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.noteCardFooter}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatNoteDate(note.updatedAt)}
            </Text>
            <View style={styles.noteIcons}>
              {hasReminder && (
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.noteIcon}
                />
              )}
              {hasLocation && (
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.noteIcon}
                />
              )}
              {hasLinks && (
                <MaterialCommunityIcons
                  name="link-variant"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.noteIcon}
                />
              )}
              {note.type === 'voice' && (
                <MaterialCommunityIcons
                  name="microphone-outline"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.noteIcon}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [
      noteColors,
      theme,
      settings.previewLines,
      handleNotePress,
      handleNoteLongPress,
      getNotePreview,
      formatNoteDate,
      getPriorityColor,
    ]
  );

  // Render note card (list)
  const renderNoteCardList = useCallback(
    (note: Note) => {
      const backgroundColor = noteColors[note.color];
      const hasReminder = note.reminders && note.reminders.length > 0;
      const hasLocation = !!note.location;
      const hasLinks = (note.linkedContactIds?.length || 0) + (note.linkedEventIds?.length || 0) > 0;

      return (
        <TouchableOpacity
          style={[styles.noteCardList, { backgroundColor }]}
          onPress={() => handleNotePress(note)}
          onLongPress={() => handleNoteLongPress(note)}
          activeOpacity={0.7}
        >
          {/* Color bar */}
          {note.priority !== 'normal' && (
            <View
              style={[
                styles.noteColorBar,
                { backgroundColor: getPriorityColor(note.priority) },
              ]}
            />
          )}

          <View style={styles.noteListContent}>
            {/* Header row */}
            <View style={styles.noteListHeader}>
              {note.isPinned && (
                <MaterialCommunityIcons
                  name="pin"
                  size={16}
                  color={theme.colors.primary}
                  style={styles.pinIcon}
                />
              )}
              <Text
                variant="titleSmall"
                style={[styles.noteListTitle, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {note.title || t('notes.untitled')}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatNoteDate(note.updatedAt)}
              </Text>
            </View>

            {/* Content preview */}
            <Text
              variant="bodySmall"
              style={[styles.noteListPreview, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {getNotePreview(note)}
            </Text>

            {/* Footer icons */}
            <View style={styles.noteListFooter}>
              {note.tags && note.tags.length > 0 && (
                <Chip
                  compact
                  style={styles.tagChip}
                  textStyle={{ fontSize: 10 }}
                >
                  {note.tags[0]}
                </Chip>
              )}
              <View style={styles.noteIcons}>
                {hasReminder && (
                  <MaterialCommunityIcons
                    name="bell-outline"
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.noteIcon}
                  />
                )}
                {hasLocation && (
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.noteIcon}
                  />
                )}
                {hasLinks && (
                  <MaterialCommunityIcons
                    name="link-variant"
                    size={14}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.noteIcon}
                  />
                )}
              </View>
            </View>
          </View>

          <IconButton
            icon="chevron-right"
            size={20}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      );
    },
    [
      noteColors,
      theme,
      handleNotePress,
      handleNoteLongPress,
      getNotePreview,
      formatNoteDate,
      getPriorityColor,
      t,
    ]
  );

  // Render note item
  const renderNoteItem = useCallback(
    ({ item }: { item: Note }) => {
      if (settings.viewMode === 'grid') {
        return renderNoteCardGrid(item);
      }
      return renderNoteCardList(item);
    },
    [settings.viewMode, renderNoteCardGrid, renderNoteCardList]
  );

  // Render section header
  const renderSectionHeader = useCallback(
    (title: string, count: number) => (
      <View style={styles.sectionHeader}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {title}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {count}
        </Text>
      </View>
    ),
    [theme]
  );

  // Get current folder name
  const currentFolderName = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === 'all') {
      return t('notes.allNotes');
    }
    if (selectedFolderId === 'archive') {
      return t('notes.archive');
    }
    if (selectedFolderId === 'trash') {
      return t('notes.trash');
    }
    const folder = folders.find((f) => f.id === selectedFolderId);
    return folder?.name || t('notes.allNotes');
  }, [selectedFolderId, folders, t]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        {isSearchActive ? (
          <View style={styles.searchHeader}>
            <Searchbar
              placeholder={t('notes.searchPlaceholder')}
              value={searchQuery}
              onChangeText={handleSearch}
              style={styles.searchBar}
              autoFocus
            />
            <IconButton
              icon="close"
              onPress={() => {
                setIsSearchActive(false);
                handleSearch('');
              }}
            />
          </View>
        ) : (
          <View style={styles.normalHeader}>
            <TouchableOpacity
              style={styles.folderSelector}
              onPress={() => setFolderModalVisible(true)}
            >
              <MaterialCommunityIcons
                name="folder-outline"
                size={24}
                color={theme.colors.onSurface}
              />
              <Text variant="titleLarge" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                {currentFolderName}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <IconButton icon="magnify" onPress={() => setIsSearchActive(true)} />
              <IconButton
                icon={settings.viewMode === 'grid' ? 'view-list' : 'view-grid'}
                onPress={handleViewModeToggle}
              />
              <Menu
                visible={sortMenuVisible}
                onDismiss={() => setSortMenuVisible(false)}
                anchor={
                  <IconButton icon="sort" onPress={() => setSortMenuVisible(true)} />
                }
              >
                <Menu.Item
                  title={t('notes.sortByUpdated')}
                  onPress={() => handleSortChange('updatedAt')}
                  leadingIcon={settings.sortBy === 'updatedAt' ? 'check' : undefined}
                />
                <Menu.Item
                  title={t('notes.sortByCreated')}
                  onPress={() => handleSortChange('createdAt')}
                  leadingIcon={settings.sortBy === 'createdAt' ? 'check' : undefined}
                />
                <Menu.Item
                  title={t('notes.sortByTitle')}
                  onPress={() => handleSortChange('title')}
                  leadingIcon={settings.sortBy === 'title' ? 'check' : undefined}
                />
                <Menu.Item
                  title={t('notes.sortByPriority')}
                  onPress={() => handleSortChange('priority')}
                  leadingIcon={settings.sortBy === 'priority' ? 'check' : undefined}
                />
              </Menu>
            </View>
          </View>
        )}

        {/* Filter chips */}
        <View style={styles.filterChips}>
          <Chip
            selected={filterType === 'all'}
            onPress={() => handleFilterTypeChange('all')}
            style={styles.filterChip}
            compact
          >
            {t('notes.all')}
          </Chip>
          <Chip
            selected={filterType === 'text'}
            onPress={() => handleFilterTypeChange('text')}
            style={styles.filterChip}
            compact
            icon="text"
          >
            {t('notes.textNotes')}
          </Chip>
          <Chip
            selected={filterType === 'checklist'}
            onPress={() => handleFilterTypeChange('checklist')}
            style={styles.filterChip}
            compact
            icon="checkbox-marked-outline"
          >
            {t('notes.checklists')}
          </Chip>
          <Chip
            selected={filterType === 'voice'}
            onPress={() => handleFilterTypeChange('voice')}
            style={styles.filterChip}
            compact
            icon="microphone"
          >
            {t('notes.voiceNotes')}
          </Chip>
        </View>
      </Surface>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="note-text-outline"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="headlineSmall"
            style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
          >
            {searchQuery ? t('notes.noSearchResults') : t('notes.noNotes')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {searchQuery ? t('notes.tryDifferentSearch') : t('notes.createFirstNote')}
          </Text>
          {!searchQuery && (
            <Button
              mode="contained"
              onPress={handleAddNote}
              style={styles.emptyButton}
              icon="plus"
            >
              {t('notes.newNote')}
            </Button>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          numColumns={settings.viewMode === 'grid' ? GRID_COLUMNS : 1}
          key={settings.viewMode}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            groupedNotes.pinned.length > 0 && settings.viewMode === 'list' ? (
              <>
                {renderSectionHeader(t('notes.pinned'), groupedNotes.pinned.length)}
              </>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Folder Selection Modal */}
      <Portal>
        <Modal
          visible={folderModalVisible}
          onDismiss={() => setFolderModalVisible(false)}
          contentContainerStyle={[
            styles.folderModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.folderModalTitle}>
            {t('notes.selectFolder')}
          </Text>
          <Divider />

          {/* Default folders */}
          <TouchableOpacity
            style={[
              styles.folderItem,
              selectedFolderId === 'all' && { backgroundColor: theme.colors.primaryContainer },
            ]}
            onPress={() => handleFolderSelect('all')}
          >
            <MaterialCommunityIcons
              name="folder-multiple-outline"
              size={24}
              color={theme.colors.onSurface}
            />
            <Text variant="bodyLarge" style={[styles.folderName, { color: theme.colors.onSurface }]}>
              {t('notes.allNotes')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.folderItem,
              selectedFolderId === 'archive' && { backgroundColor: theme.colors.primaryContainer },
            ]}
            onPress={() => handleFolderSelect('archive')}
          >
            <MaterialCommunityIcons
              name="archive-outline"
              size={24}
              color={theme.colors.onSurface}
            />
            <Text variant="bodyLarge" style={[styles.folderName, { color: theme.colors.onSurface }]}>
              {t('notes.archive')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.folderItem,
              selectedFolderId === 'trash' && { backgroundColor: theme.colors.primaryContainer },
            ]}
            onPress={() => handleFolderSelect('trash')}
          >
            <MaterialCommunityIcons
              name="delete-outline"
              size={24}
              color={theme.colors.onSurface}
            />
            <Text variant="bodyLarge" style={[styles.folderName, { color: theme.colors.onSurface }]}>
              {t('notes.trash')}
            </Text>
          </TouchableOpacity>

          <Divider style={styles.folderDivider} />

          {/* User folders */}
          {folders.map((folder) => (
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.folderItem,
                selectedFolderId === folder.id && { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={() => handleFolderSelect(folder.id)}
            >
              <MaterialCommunityIcons
                name={folder.icon || 'folder-outline'}
                size={24}
                color={folder.color ? NOTE_COLORS[folder.color] : theme.colors.onSurface}
              />
              <Text variant="bodyLarge" style={[styles.folderName, { color: theme.colors.onSurface }]}>
                {folder.name}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {folder.noteCount}
              </Text>
            </TouchableOpacity>
          ))}

          <Divider style={styles.folderDivider} />

          <Button
            mode="text"
            icon="folder-plus"
            onPress={() => {
              setFolderModalVisible(false);
              // TODO: Open create folder dialog
            }}
          >
            {t('notes.createFolder')}
          </Button>
        </Modal>
      </Portal>

      {/* FAB */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 },
        ]}
        color={theme.colors.onPrimary}
        onPress={handleAddNote}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  normalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  folderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    marginLeft: 8,
    marginRight: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChips: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  // Grid card styles
  noteCardGrid: {
    width: GRID_ITEM_WIDTH,
    minHeight: 120,
    marginRight: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinIcon: {
    marginRight: 4,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noteTitle: {
    marginBottom: 4,
  },
  notePreview: {
    flex: 1,
    marginBottom: 8,
  },
  checklistProgress: {
    marginBottom: 8,
  },
  checklistProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  checklistProgressFill: {
    height: '100%',
  },
  noteCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteIcons: {
    flexDirection: 'row',
  },
  noteIcon: {
    marginLeft: 4,
  },
  // List card styles
  noteCardList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  noteColorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  noteListContent: {
    flex: 1,
    padding: 12,
  },
  noteListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteListTitle: {
    flex: 1,
    marginLeft: 4,
  },
  noteListPreview: {
    marginTop: 4,
  },
  noteListFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tagChip: {
    marginRight: 8,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
  },
  // Folder modal
  folderModal: {
    margin: 20,
    borderRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  folderModalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  folderName: {
    flex: 1,
    marginLeft: 12,
  },
  folderDivider: {
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
});

export default NotesScreen;
