/**
 * LifeCall - Not Detay Ekranı
 *
 * Not detay görünümü:
 * - Başlık ve içerik
 * - Kontrol listesi görünümü
 * - Sesli not oynatma
 * - Bağlı kişiler ve etkinlikler
 * - Hatırlatıcılar
 * - Konum
 * - Paylaşma
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  IconButton,
  Surface,
  Chip,
  Divider,
  FAB,
  Menu,
  Portal,
  Dialog,
  Button,
  List,
  Checkbox,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { tr, enUS, de, fr, es, ru, ar } from 'date-fns/locale';

import { useAppTheme } from '../theme';
import { RootState, AppDispatch } from '../store';
import {
  togglePin,
  toggleArchive,
  trashNote,
  restoreNote,
  deleteNotePermanently,
  toggleChecklistItem,
} from '../store/slices/notesSlice';
import {
  NOTE_COLORS,
  NOTE_COLORS_DARK,
  PRIORITY_OPTIONS,
} from '../types/notes';
import { RootStackParamList } from '../navigation/types';

type NoteDetailRouteProp = RouteProp<RootStackParamList, 'NoteDetail'>;

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

const NoteDetailScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<NoteDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { noteId } = route.params;

  // Redux state
  const note = useSelector((state: RootState) =>
    state.notes.notes.find((n) => n.id === noteId)
  );
  const contacts = useSelector((state: RootState) => state.contacts.contacts);
  const events = useSelector((state: RootState) => state.calendar.events);

  // Local state
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Locale
  const locale = LOCALES[i18n.language] || enUS;

  // Note colors
  const noteColors = isDark ? NOTE_COLORS_DARK : NOTE_COLORS;

  // Get linked contacts
  const linkedContacts = useMemo(() => {
    if (!note?.linkedContactIds) return [];
    return contacts.filter((c) => note.linkedContactIds!.includes(c.id));
  }, [contacts, note?.linkedContactIds]);

  // Get linked events
  const linkedEvents = useMemo(() => {
    if (!note?.linkedEventIds) return [];
    return events.filter((e) => note.linkedEventIds!.includes(e.id));
  }, [events, note?.linkedEventIds]);

  // Priority info
  const priorityInfo = useMemo(() => {
    if (!note) return null;
    return PRIORITY_OPTIONS.find((p) => p.value === note.priority);
  }, [note?.priority]);

  // Format date
  const formatDate = useCallback(
    (dateStr: string) => {
      const date = parseISO(dateStr);
      return format(date, 'dd MMMM yyyy, HH:mm', { locale });
    },
    [locale]
  );

  // Handle edit
  const handleEdit = useCallback(() => {
    navigation.navigate('NoteEdit' as never, { noteId: note?.id } as never);
  }, [navigation, note?.id]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!note) return;

    let content = '';
    if (note.title) {
      content += note.title + '\n\n';
    }

    if (note.type === 'checklist' && note.checklistItems) {
      note.checklistItems.forEach((item) => {
        content += `${item.checked ? '☑' : '☐'} ${item.text}\n`;
      });
    } else {
      content += note.content;
    }

    try {
      await Share.share({
        message: content,
        title: note.title || t('notes.note'),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [note, t]);

  // Handle toggle pin
  const handleTogglePin = useCallback(() => {
    if (note) {
      dispatch(togglePin(note.id));
    }
    setMenuVisible(false);
  }, [dispatch, note]);

  // Handle toggle archive
  const handleToggleArchive = useCallback(() => {
    if (note) {
      dispatch(toggleArchive(note.id));
      navigation.goBack();
    }
    setMenuVisible(false);
  }, [dispatch, note, navigation]);

  // Handle trash
  const handleTrash = useCallback(() => {
    if (note) {
      dispatch(trashNote(note.id));
      navigation.goBack();
    }
    setMenuVisible(false);
  }, [dispatch, note, navigation]);

  // Handle restore
  const handleRestore = useCallback(() => {
    if (note) {
      dispatch(restoreNote(note.id));
    }
    setMenuVisible(false);
  }, [dispatch, note]);

  // Handle permanent delete
  const handleDeletePermanently = useCallback(() => {
    setDeleteDialogVisible(false);
    if (note) {
      dispatch(deleteNotePermanently(note.id));
      navigation.goBack();
    }
  }, [dispatch, note, navigation]);

  // Handle checklist item toggle
  const handleChecklistToggle = useCallback(
    (itemId: string) => {
      if (note) {
        dispatch(toggleChecklistItem({ noteId: note.id, itemId }));
      }
    },
    [dispatch, note]
  );

  // Handle contact press
  const handleContactPress = useCallback(
    (contactId: string) => {
      navigation.navigate('ContactDetail' as never, { contactId } as never);
    },
    [navigation]
  );

  // Handle event press
  const handleEventPress = useCallback(
    (eventId: string) => {
      navigation.navigate('EventDetail' as never, { eventId } as never);
    },
    [navigation]
  );

  // Handle location press
  const handleLocationPress = useCallback(() => {
    if (note?.location?.latitude && note?.location?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${note.location.latitude},${note.location.longitude}`;
      Linking.openURL(url);
    }
  }, [note?.location]);

  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Surface style={[styles.header, { paddingTop: insets.top }]} elevation={1}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
          <Text variant="titleLarge">{t('notes.noteNotFound')}</Text>
        </Surface>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="note-off-outline"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyLarge"
            style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('notes.noteNotFoundMessage')}
          </Text>
        </View>
      </View>
    );
  }

  const backgroundColor = noteColors[note.color];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <Surface
        style={[styles.header, { backgroundColor: 'transparent', paddingTop: insets.top }]}
        elevation={0}
      >
        <View style={styles.headerContent}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />

          <View style={styles.headerActions}>
            {/* Pin indicator */}
            {note.isPinned && (
              <MaterialCommunityIcons
                name="pin"
                size={20}
                color={theme.colors.primary}
                style={styles.pinIcon}
              />
            )}

            {/* Priority indicator */}
            {priorityInfo && note.priority !== 'normal' && (
              <View
                style={[styles.priorityBadge, { backgroundColor: priorityInfo.color }]}
              >
                <Text style={styles.priorityText}>
                  {t(`notes.priority.${priorityInfo.labelKey}`)}
                </Text>
              </View>
            )}

            <IconButton icon="share-variant" onPress={handleShare} />

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                leadingIcon={note.isPinned ? 'pin-off' : 'pin'}
                title={note.isPinned ? t('notes.unpin') : t('notes.pin')}
                onPress={handleTogglePin}
              />
              <Menu.Item
                leadingIcon={note.isArchived ? 'archive-off' : 'archive'}
                title={note.isArchived ? t('notes.unarchive') : t('notes.archive')}
                onPress={handleToggleArchive}
              />
              <Divider />
              {note.isTrashed ? (
                <>
                  <Menu.Item
                    leadingIcon="restore"
                    title={t('notes.restore')}
                    onPress={handleRestore}
                  />
                  <Menu.Item
                    leadingIcon="delete-forever"
                    title={t('notes.deletePermanently')}
                    onPress={() => {
                      setMenuVisible(false);
                      setDeleteDialogVisible(true);
                    }}
                  />
                </>
              ) : (
                <Menu.Item
                  leadingIcon="delete-outline"
                  title={t('notes.moveToTrash')}
                  onPress={handleTrash}
                />
              )}
            </Menu>
          </View>
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        {note.title && (
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            {note.title}
          </Text>
        )}

        {/* Meta info */}
        <View style={styles.metaRow}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('notes.lastModified')}: {formatDate(note.updatedAt)}
          </Text>
        </View>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {note.tags.map((tag) => (
              <Chip key={tag} compact style={styles.tagChip} icon="tag">
                {tag}
              </Chip>
            ))}
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Content */}
        {note.type === 'text' && (
          <Text
            variant="bodyLarge"
            style={[styles.contentText, { color: theme.colors.onSurface }]}
          >
            {note.content || t('notes.emptyNote')}
          </Text>
        )}

        {/* Checklist */}
        {note.type === 'checklist' && note.checklistItems && (
          <View style={styles.checklistContainer}>
            {note.checklistItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => handleChecklistToggle(item.id)}
              >
                <Checkbox
                  status={item.checked ? 'checked' : 'unchecked'}
                  onPress={() => handleChecklistToggle(item.id)}
                />
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.checklistText,
                    { color: theme.colors.onSurface },
                    item.checked && styles.checklistTextChecked,
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Progress */}
            <View style={styles.checklistProgress}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {note.checklistItems.filter((i) => i.checked).length} / {note.checklistItems.length} {t('notes.completed')}
              </Text>
            </View>
          </View>
        )}

        {/* Voice note */}
        {note.type === 'voice' && note.voiceRecordingUri && (
          <View style={styles.voiceContainer}>
            <TouchableOpacity style={styles.voicePlayer}>
              <IconButton
                icon="play-circle"
                size={48}
                iconColor={theme.colors.primary}
              />
              <View style={styles.voiceInfo}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t('notes.voiceNote')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {note.voiceDuration ? `${Math.floor(note.voiceDuration / 60)}:${(note.voiceDuration % 60).toString().padStart(2, '0')}` : '--:--'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Linked Contacts */}
        {linkedContacts.length > 0 && (
          <View style={styles.linkedSection}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              {t('notes.linkedContacts')}
            </Text>
            {linkedContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.linkedItem}
                onPress={() => handleContactPress(contact.id)}
              >
                <MaterialCommunityIcons
                  name="account-circle"
                  size={40}
                  color={theme.colors.primary}
                />
                <View style={styles.linkedItemInfo}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {contact.displayName}
                  </Text>
                  {contact.phoneNumbers[0] && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {contact.phoneNumbers[0].formattedNumber}
                    </Text>
                  )}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Linked Events */}
        {linkedEvents.length > 0 && (
          <View style={styles.linkedSection}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              {t('notes.linkedEvents')}
            </Text>
            {linkedEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.linkedItem}
                onPress={() => handleEventPress(event.id)}
              >
                <MaterialCommunityIcons
                  name="calendar"
                  size={40}
                  color={theme.colors.primary}
                />
                <View style={styles.linkedItemInfo}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {event.title}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {format(parseISO(event.startDate), 'dd MMM yyyy, HH:mm', { locale })}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reminders */}
        {note.reminders && note.reminders.length > 0 && (
          <View style={styles.linkedSection}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              {t('notes.reminders')}
            </Text>
            {note.reminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderItem}>
                <MaterialCommunityIcons
                  name={reminder.isEnabled ? 'bell' : 'bell-off'}
                  size={24}
                  color={reminder.isEnabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.reminderText,
                    { color: reminder.isEnabled ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
                  ]}
                >
                  {format(parseISO(reminder.dateTime), 'dd MMM yyyy, HH:mm', { locale })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Location */}
        {note.location && (
          <View style={styles.linkedSection}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              {t('notes.location')}
            </Text>
            <TouchableOpacity style={styles.locationItem} onPress={handleLocationPress}>
              <MaterialCommunityIcons
                name="map-marker"
                size={40}
                color={theme.colors.primary}
              />
              <View style={styles.linkedItemInfo}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {note.location.placeName || t('notes.viewOnMap')}
                </Text>
                {note.location.address && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {note.location.address}
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons
                name="open-in-new"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Attachments */}
        {note.attachments && note.attachments.length > 0 && (
          <View style={styles.linkedSection}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              {t('notes.attachments')}
            </Text>
            {note.attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentItem}>
                <MaterialCommunityIcons
                  name={
                    attachment.type === 'image'
                      ? 'image'
                      : attachment.type === 'audio'
                      ? 'music-note'
                      : 'file'
                  }
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  variant="bodyMedium"
                  style={[styles.attachmentName, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {attachment.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Created date */}
        <View style={styles.createdInfo}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('notes.created')}: {formatDate(note.createdAt)}
          </Text>
        </View>
      </ScrollView>

      {/* FAB - Edit */}
      {!note.isTrashed && (
        <FAB
          icon="pencil"
          style={[
            styles.fab,
            { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 },
          ]}
          color={theme.colors.onPrimary}
          onPress={handleEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>{t('notes.deletePermanently')}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t('notes.deletePermanentlyMessage')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={handleDeletePermanently} textColor={theme.colors.error}>
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    marginBottom: 8,
    fontWeight: '600',
  },
  metaRow: {
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 16,
  },
  contentText: {
    lineHeight: 28,
  },
  // Checklist
  checklistContainer: {
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checklistText: {
    flex: 1,
    marginLeft: 8,
  },
  checklistTextChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  checklistProgress: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  // Voice
  voiceContainer: {
    marginBottom: 16,
  },
  voicePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  voiceInfo: {
    flex: 1,
    marginLeft: 8,
  },
  // Linked sections
  linkedSection: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  linkedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  linkedItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  reminderText: {
    marginLeft: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  attachmentName: {
    flex: 1,
    marginLeft: 12,
  },
  createdInfo: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
});

export default NoteDetailScreen;
