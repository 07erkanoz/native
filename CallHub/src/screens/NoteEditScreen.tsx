/**
 * LifeCall - Not Düzenleme Ekranı
 *
 * Zengin metin editörü:
 * - Metin biçimlendirme (kalın, italik, altı çizili)
 * - Kontrol listesi
 * - Sesli not
 * - Kişi bağlama
 * - Takvim bağlama
 * - Konum ekleme
 * - Hatırlatıcı kurma
 * - Renk ve öncelik seçimi
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import {
  Text,
  IconButton,
  Surface,
  Chip,
  Menu,
  Portal,
  Modal,
  Button,
  Divider,
  List,
  Checkbox,
  FAB,
  ActivityIndicator,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO, addHours } from 'date-fns';
import { tr, enUS, de, fr, es, ru, ar } from 'date-fns/locale';
import uuid from 'react-native-uuid';

import { useAppTheme } from '../theme';
import { RootState, AppDispatch } from '../store';
import {
  createNote,
  updateNote,
  addChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addReminder,
  removeReminder,
  linkContact,
  unlinkContact,
  linkEvent,
  unlinkEvent,
} from '../store/slices/notesSlice';
import {
  Note,
  NoteType,
  NoteColor,
  NotePriority,
  NOTE_COLORS,
  NOTE_COLORS_DARK,
  ChecklistItem,
  NoteReminder,
  NoteLocation,
  PRIORITY_OPTIONS,
} from '../types/notes';
import { RootStackParamList } from '../navigation/types';
import { Contact } from '../types';
import { CalendarEvent } from '../types/calendar';

type NoteEditRouteProp = RouteProp<RootStackParamList, 'NoteEdit'>;

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

const NoteEditScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<NoteEditRouteProp>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { noteId, callId, contactId: initialContactId, eventId: initialEventId } = route.params || {};

  // Redux state
  const existingNote = useSelector((state: RootState) =>
    noteId ? state.notes.notes.find((n) => n.id === noteId) : null
  );
  const contacts = useSelector((state: RootState) => state.contacts.contacts);
  const events = useSelector((state: RootState) => state.calendar.events);
  const folders = useSelector((state: RootState) => state.notes.folders);
  const tags = useSelector((state: RootState) => state.notes.tags);

  // Locale
  const locale = LOCALES[i18n.language] || enUS;

  // Note colors
  const noteColors = isDark ? NOTE_COLORS_DARK : NOTE_COLORS;

  // Refs
  const contentInputRef = useRef<TextInput>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Local state
  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [noteType, setNoteType] = useState<NoteType>(existingNote?.type || 'text');
  const [color, setColor] = useState<NoteColor>(existingNote?.color || 'default');
  const [priority, setPriority] = useState<NotePriority>(existingNote?.priority || 'normal');
  const [isPinned, setIsPinned] = useState(existingNote?.isPinned || false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    existingNote?.checklistItems || []
  );
  const [linkedContactIds, setLinkedContactIds] = useState<string[]>(
    existingNote?.linkedContactIds || (initialContactId ? [initialContactId] : [])
  );
  const [linkedEventIds, setLinkedEventIds] = useState<string[]>(
    existingNote?.linkedEventIds || (initialEventId ? [initialEventId] : [])
  );
  const [reminders, setReminders] = useState<NoteReminder[]>(existingNote?.reminders || []);
  const [location, setLocation] = useState<NoteLocation | undefined>(existingNote?.location);
  const [selectedTags, setSelectedTags] = useState<string[]>(existingNote?.tags || []);
  const [folderId, setFolderId] = useState<string | undefined>(existingNote?.folderId);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [colorMenuVisible, setColorMenuVisible] = useState(false);
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [tagsModalVisible, setTagsModalVisible] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Reminder picker state
  const [reminderDate, setReminderDate] = useState(addHours(new Date(), 1));
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

  // Color options
  const colorOptions: { value: NoteColor; color: string }[] = [
    { value: 'default', color: noteColors.default },
    { value: 'red', color: noteColors.red },
    { value: 'orange', color: noteColors.orange },
    { value: 'yellow', color: noteColors.yellow },
    { value: 'green', color: noteColors.green },
    { value: 'teal', color: noteColors.teal },
    { value: 'blue', color: noteColors.blue },
    { value: 'purple', color: noteColors.purple },
    { value: 'pink', color: noteColors.pink },
  ];

  // Mark changes
  useEffect(() => {
    if (existingNote) {
      const changed =
        title !== existingNote.title ||
        content !== existingNote.content ||
        noteType !== existingNote.type ||
        color !== existingNote.color ||
        priority !== existingNote.priority ||
        isPinned !== existingNote.isPinned ||
        JSON.stringify(checklistItems) !== JSON.stringify(existingNote.checklistItems) ||
        JSON.stringify(linkedContactIds) !== JSON.stringify(existingNote.linkedContactIds) ||
        JSON.stringify(linkedEventIds) !== JSON.stringify(existingNote.linkedEventIds) ||
        JSON.stringify(reminders) !== JSON.stringify(existingNote.reminders) ||
        JSON.stringify(location) !== JSON.stringify(existingNote.location) ||
        JSON.stringify(selectedTags) !== JSON.stringify(existingNote.tags) ||
        folderId !== existingNote.folderId;
      setHasChanges(changed);
    } else {
      setHasChanges(title.length > 0 || content.length > 0 || checklistItems.length > 0);
    }
  }, [
    existingNote,
    title,
    content,
    noteType,
    color,
    priority,
    isPinned,
    checklistItems,
    linkedContactIds,
    linkedEventIds,
    reminders,
    location,
    selectedTags,
    folderId,
  ]);

  // Auto-save
  useEffect(() => {
    if (hasChanges && existingNote) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSave(true);
      }, 5000);
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasChanges, existingNote]);

  // Handle back with unsaved changes
  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        t('notes.unsavedChanges'),
        t('notes.unsavedChangesMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.discard'),
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
          {
            text: t('common.save'),
            onPress: () => handleSave(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation, t]);

  // Save note
  const handleSave = useCallback(
    async (isAutoSave = false) => {
      if (!title.trim() && !content.trim() && checklistItems.length === 0) {
        if (!isAutoSave) {
          Alert.alert(t('notes.error'), t('notes.emptyNoteError'));
        }
        return;
      }

      setIsSaving(true);

      try {
        const noteData = {
          title: title.trim(),
          content: content.trim(),
          type: noteType,
          color,
          priority,
          isPinned,
          checklistItems: noteType === 'checklist' ? checklistItems : undefined,
          linkedContactIds: linkedContactIds.length > 0 ? linkedContactIds : undefined,
          linkedEventIds: linkedEventIds.length > 0 ? linkedEventIds : undefined,
          reminders: reminders.length > 0 ? reminders : undefined,
          location,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          folderId,
        };

        if (existingNote) {
          await dispatch(updateNote({ id: existingNote.id, updates: noteData }));
        } else {
          await dispatch(createNote(noteData));
        }

        setHasChanges(false);
        if (!isAutoSave) {
          navigation.goBack();
        }
      } catch (error) {
        console.error('Note save error:', error);
        if (!isAutoSave) {
          Alert.alert(t('notes.error'), t('notes.saveError'));
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      title,
      content,
      noteType,
      color,
      priority,
      isPinned,
      checklistItems,
      linkedContactIds,
      linkedEventIds,
      reminders,
      location,
      selectedTags,
      folderId,
      existingNote,
      dispatch,
      navigation,
      t,
    ]
  );

  // Add checklist item
  const handleAddChecklistItem = useCallback(() => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: uuid.v4() as string,
        text: newChecklistItem.trim(),
        checked: false,
        createdAt: new Date().toISOString(),
      };
      setChecklistItems([...checklistItems, newItem]);
      setNewChecklistItem('');
    }
  }, [newChecklistItem, checklistItems]);

  // Toggle checklist item
  const handleToggleChecklistItem = useCallback(
    (itemId: string) => {
      setChecklistItems(
        checklistItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                checked: !item.checked,
                completedAt: !item.checked ? new Date().toISOString() : undefined,
              }
            : item
        )
      );
    },
    [checklistItems]
  );

  // Delete checklist item
  const handleDeleteChecklistItem = useCallback(
    (itemId: string) => {
      setChecklistItems(checklistItems.filter((item) => item.id !== itemId));
    },
    [checklistItems]
  );

  // Update checklist item text
  const handleUpdateChecklistItemText = useCallback(
    (itemId: string, text: string) => {
      setChecklistItems(
        checklistItems.map((item) => (item.id === itemId ? { ...item, text } : item))
      );
    },
    [checklistItems]
  );

  // Add reminder
  const handleAddReminder = useCallback(() => {
    const newReminder: NoteReminder = {
      id: uuid.v4() as string,
      dateTime: reminderDate.toISOString(),
      type: 'notification',
      isEnabled: true,
    };
    setReminders([...reminders, newReminder]);
    setReminderModalVisible(false);
    setReminderDate(addHours(new Date(), 1));
  }, [reminderDate, reminders]);

  // Remove reminder
  const handleRemoveReminder = useCallback(
    (reminderId: string) => {
      setReminders(reminders.filter((r) => r.id !== reminderId));
    },
    [reminders]
  );

  // Toggle contact link
  const handleToggleContactLink = useCallback(
    (contactIdToToggle: string) => {
      if (linkedContactIds.includes(contactIdToToggle)) {
        setLinkedContactIds(linkedContactIds.filter((id) => id !== contactIdToToggle));
      } else {
        setLinkedContactIds([...linkedContactIds, contactIdToToggle]);
      }
    },
    [linkedContactIds]
  );

  // Toggle event link
  const handleToggleEventLink = useCallback(
    (eventIdToToggle: string) => {
      if (linkedEventIds.includes(eventIdToToggle)) {
        setLinkedEventIds(linkedEventIds.filter((id) => id !== eventIdToToggle));
      } else {
        setLinkedEventIds([...linkedEventIds, eventIdToToggle]);
      }
    },
    [linkedEventIds]
  );

  // Toggle tag
  const handleToggleTag = useCallback(
    (tagName: string) => {
      if (selectedTags.includes(tagName)) {
        setSelectedTags(selectedTags.filter((t) => t !== tagName));
      } else {
        setSelectedTags([...selectedTags, tagName]);
      }
    },
    [selectedTags]
  );

  // Get linked contacts
  const linkedContacts = useMemo(() => {
    return contacts.filter((c) => linkedContactIds.includes(c.id));
  }, [contacts, linkedContactIds]);

  // Get linked events
  const linkedEvents = useMemo(() => {
    return events.filter((e) => linkedEventIds.includes(e.id));
  }, [events, linkedEventIds]);

  // Navigation options
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: noteColors[color] }]}>
      {/* Header */}
      <Surface
        style={[styles.header, { backgroundColor: 'transparent' }]}
        elevation={0}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <IconButton icon="arrow-left" onPress={handleBack} />

          <View style={styles.headerActions}>
            {/* Pin toggle */}
            <IconButton
              icon={isPinned ? 'pin' : 'pin-outline'}
              iconColor={isPinned ? theme.colors.primary : theme.colors.onSurfaceVariant}
              onPress={() => setIsPinned(!isPinned)}
            />

            {/* Color menu */}
            <Menu
              visible={colorMenuVisible}
              onDismiss={() => setColorMenuVisible(false)}
              anchor={
                <IconButton
                  icon="palette-outline"
                  onPress={() => setColorMenuVisible(true)}
                />
              }
              contentStyle={styles.colorMenu}
            >
              <View style={styles.colorOptions}>
                {colorOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.colorOption,
                      { backgroundColor: option.color },
                      color === option.value && styles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      setColor(option.value);
                      setColorMenuVisible(false);
                    }}
                  >
                    {color === option.value && (
                      <MaterialCommunityIcons
                        name="check"
                        size={20}
                        color={theme.colors.onSurface}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Menu>

            {/* Priority menu */}
            <Menu
              visible={priorityMenuVisible}
              onDismiss={() => setPriorityMenuVisible(false)}
              anchor={
                <IconButton
                  icon="flag-outline"
                  iconColor={
                    priority !== 'normal'
                      ? PRIORITY_OPTIONS.find((p) => p.value === priority)?.color
                      : theme.colors.onSurfaceVariant
                  }
                  onPress={() => setPriorityMenuVisible(true)}
                />
              }
            >
              {PRIORITY_OPTIONS.map((option) => (
                <Menu.Item
                  key={option.value}
                  title={t(`notes.priority.${option.labelKey}`)}
                  leadingIcon={() => (
                    <MaterialCommunityIcons
                      name="flag"
                      size={20}
                      color={option.color}
                    />
                  )}
                  onPress={() => {
                    setPriority(option.value);
                    setPriorityMenuVisible(false);
                  }}
                />
              ))}
            </Menu>

            {/* More menu */}
            <Menu
              visible={moreMenuVisible}
              onDismiss={() => setMoreMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMoreMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                leadingIcon="account-plus-outline"
                title={t('notes.linkContact')}
                onPress={() => {
                  setMoreMenuVisible(false);
                  setContactsModalVisible(true);
                }}
              />
              <Menu.Item
                leadingIcon="calendar-plus"
                title={t('notes.linkEvent')}
                onPress={() => {
                  setMoreMenuVisible(false);
                  setEventsModalVisible(true);
                }}
              />
              <Menu.Item
                leadingIcon="bell-plus-outline"
                title={t('notes.addReminder')}
                onPress={() => {
                  setMoreMenuVisible(false);
                  setReminderModalVisible(true);
                }}
              />
              <Menu.Item
                leadingIcon="map-marker-plus-outline"
                title={t('notes.addLocation')}
                onPress={() => {
                  setMoreMenuVisible(false);
                  setLocationModalVisible(true);
                }}
              />
              <Menu.Item
                leadingIcon="tag-plus-outline"
                title={t('notes.addTags')}
                onPress={() => {
                  setMoreMenuVisible(false);
                  setTagsModalVisible(true);
                }}
              />
              <Divider />
              <Menu.Item
                leadingIcon="delete-outline"
                title={t('notes.delete')}
                onPress={() => {
                  setMoreMenuVisible(false);
                  Alert.alert(
                    t('notes.deleteNote'),
                    t('notes.deleteNoteConfirm'),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.delete'),
                        style: 'destructive',
                        onPress: () => {
                          // TODO: Delete note
                          navigation.goBack();
                        },
                      },
                    ]
                  );
                }}
              />
            </Menu>

            {/* Save button */}
            {isSaving ? (
              <ActivityIndicator size="small" style={{ marginHorizontal: 12 }} />
            ) : (
              <IconButton
                icon="check"
                iconColor={hasChanges ? theme.colors.primary : theme.colors.onSurfaceVariant}
                onPress={() => handleSave()}
              />
            )}
          </View>
        </View>
      </Surface>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Note type selector */}
          <View style={styles.typeSelector}>
            <Chip
              selected={noteType === 'text'}
              onPress={() => setNoteType('text')}
              style={styles.typeChip}
              icon="text"
            >
              {t('notes.text')}
            </Chip>
            <Chip
              selected={noteType === 'checklist'}
              onPress={() => setNoteType('checklist')}
              style={styles.typeChip}
              icon="checkbox-marked-outline"
            >
              {t('notes.checklist')}
            </Chip>
            <Chip
              selected={noteType === 'voice'}
              onPress={() => setNoteType('voice')}
              style={styles.typeChip}
              icon="microphone"
            >
              {t('notes.voice')}
            </Chip>
          </View>

          {/* Title input */}
          <TextInput
            style={[styles.titleInput, { color: theme.colors.onSurface }]}
            placeholder={t('notes.titlePlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={200}
          />

          {/* Content area based on type */}
          {noteType === 'text' && (
            <TextInput
              ref={contentInputRef}
              style={[styles.contentInput, { color: theme.colors.onSurface }]}
              placeholder={t('notes.contentPlaceholder')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          )}

          {noteType === 'checklist' && (
            <View style={styles.checklistContainer}>
              {/* Existing items */}
              {checklistItems.map((item) => (
                <View key={item.id} style={styles.checklistItem}>
                  <Checkbox
                    status={item.checked ? 'checked' : 'unchecked'}
                    onPress={() => handleToggleChecklistItem(item.id)}
                  />
                  <TextInput
                    style={[
                      styles.checklistItemText,
                      { color: theme.colors.onSurface },
                      item.checked && styles.checklistItemTextChecked,
                    ]}
                    value={item.text}
                    onChangeText={(text) => handleUpdateChecklistItemText(item.id, text)}
                    placeholder={t('notes.checklistItemPlaceholder')}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                  <IconButton
                    icon="close"
                    size={18}
                    onPress={() => handleDeleteChecklistItem(item.id)}
                  />
                </View>
              ))}

              {/* New item input */}
              <View style={styles.checklistItem}>
                <Checkbox status="unchecked" disabled />
                <TextInput
                  style={[styles.checklistItemText, { color: theme.colors.onSurface }]}
                  value={newChecklistItem}
                  onChangeText={setNewChecklistItem}
                  placeholder={t('notes.addChecklistItem')}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  onSubmitEditing={handleAddChecklistItem}
                  returnKeyType="done"
                />
                {newChecklistItem.length > 0 && (
                  <IconButton
                    icon="plus"
                    size={18}
                    onPress={handleAddChecklistItem}
                  />
                )}
              </View>
            </View>
          )}

          {noteType === 'voice' && (
            <View style={styles.voiceContainer}>
              <MaterialCommunityIcons
                name="microphone"
                size={64}
                color={theme.colors.primary}
              />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                {t('notes.voiceRecordingPlaceholder')}
              </Text>
              <Button
                mode="contained"
                icon="record"
                onPress={() => {
                  // TODO: Start recording
                }}
                style={styles.recordButton}
              >
                {t('notes.startRecording')}
              </Button>
            </View>
          )}

          {/* Linked contacts */}
          {linkedContacts.length > 0 && (
            <View style={styles.linkedSection}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('notes.linkedContacts')}
              </Text>
              <View style={styles.linkedChips}>
                {linkedContacts.map((contact) => (
                  <Chip
                    key={contact.id}
                    icon="account"
                    onClose={() => handleToggleContactLink(contact.id)}
                    style={styles.linkedChip}
                  >
                    {contact.displayName}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Linked events */}
          {linkedEvents.length > 0 && (
            <View style={styles.linkedSection}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('notes.linkedEvents')}
              </Text>
              <View style={styles.linkedChips}>
                {linkedEvents.map((event) => (
                  <Chip
                    key={event.id}
                    icon="calendar"
                    onClose={() => handleToggleEventLink(event.id)}
                    style={styles.linkedChip}
                  >
                    {event.title}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Reminders */}
          {reminders.length > 0 && (
            <View style={styles.linkedSection}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('notes.reminders')}
              </Text>
              <View style={styles.linkedChips}>
                {reminders.map((reminder) => (
                  <Chip
                    key={reminder.id}
                    icon="bell"
                    onClose={() => handleRemoveReminder(reminder.id)}
                    style={styles.linkedChip}
                  >
                    {format(parseISO(reminder.dateTime), 'dd MMM HH:mm', { locale })}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Location */}
          {location && (
            <View style={styles.linkedSection}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('notes.location')}
              </Text>
              <Chip
                icon="map-marker"
                onClose={() => setLocation(undefined)}
                style={styles.linkedChip}
              >
                {location.placeName || location.address || t('notes.locationSet')}
              </Chip>
            </View>
          )}

          {/* Tags */}
          {selectedTags.length > 0 && (
            <View style={styles.linkedSection}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('notes.tags')}
              </Text>
              <View style={styles.linkedChips}>
                {selectedTags.map((tag) => (
                  <Chip
                    key={tag}
                    icon="tag"
                    onClose={() => handleToggleTag(tag)}
                    style={styles.linkedChip}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Contacts Modal */}
      <Portal>
        <Modal
          visible={contactsModalVisible}
          onDismiss={() => setContactsModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('notes.selectContacts')}
          </Text>
          <ScrollView style={styles.modalList}>
            {contacts.slice(0, 50).map((contact) => (
              <List.Item
                key={contact.id}
                title={contact.displayName}
                description={contact.phoneNumbers[0]?.formattedNumber}
                left={(props) => (
                  <Checkbox
                    {...props}
                    status={linkedContactIds.includes(contact.id) ? 'checked' : 'unchecked'}
                    onPress={() => handleToggleContactLink(contact.id)}
                  />
                )}
                onPress={() => handleToggleContactLink(contact.id)}
              />
            ))}
          </ScrollView>
          <Button mode="contained" onPress={() => setContactsModalVisible(false)}>
            {t('common.done')}
          </Button>
        </Modal>
      </Portal>

      {/* Events Modal */}
      <Portal>
        <Modal
          visible={eventsModalVisible}
          onDismiss={() => setEventsModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('notes.selectEvents')}
          </Text>
          <ScrollView style={styles.modalList}>
            {events.slice(0, 50).map((event) => (
              <List.Item
                key={event.id}
                title={event.title}
                description={format(parseISO(event.startDate), 'dd MMM yyyy', { locale })}
                left={(props) => (
                  <Checkbox
                    {...props}
                    status={linkedEventIds.includes(event.id) ? 'checked' : 'unchecked'}
                    onPress={() => handleToggleEventLink(event.id)}
                  />
                )}
                onPress={() => handleToggleEventLink(event.id)}
              />
            ))}
          </ScrollView>
          <Button mode="contained" onPress={() => setEventsModalVisible(false)}>
            {t('common.done')}
          </Button>
        </Modal>
      </Portal>

      {/* Reminder Modal */}
      <Portal>
        <Modal
          visible={reminderModalVisible}
          onDismiss={() => setReminderModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('notes.setReminder')}
          </Text>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowReminderDatePicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyLarge" style={[styles.dateTimeText, { color: theme.colors.onSurface }]}>
              {format(reminderDate, 'dd MMMM yyyy', { locale })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowReminderTimePicker(true)}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyLarge" style={[styles.dateTimeText, { color: theme.colors.onSurface }]}>
              {format(reminderDate, 'HH:mm', { locale })}
            </Text>
          </TouchableOpacity>

          {showReminderDatePicker && (
            <DateTimePicker
              value={reminderDate}
              mode="date"
              onChange={(event, date) => {
                setShowReminderDatePicker(false);
                if (date) setReminderDate(date);
              }}
            />
          )}

          {showReminderTimePicker && (
            <DateTimePicker
              value={reminderDate}
              mode="time"
              onChange={(event, date) => {
                setShowReminderTimePicker(false);
                if (date) setReminderDate(date);
              }}
            />
          )}

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setReminderModalVisible(false)}>
              {t('common.cancel')}
            </Button>
            <Button mode="contained" onPress={handleAddReminder}>
              {t('common.add')}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Tags Modal */}
      <Portal>
        <Modal
          visible={tagsModalVisible}
          onDismiss={() => setTagsModalVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('notes.selectTags')}
          </Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <Chip
                key={tag.id}
                selected={selectedTags.includes(tag.name)}
                onPress={() => handleToggleTag(tag.name)}
                style={styles.tagChip}
              >
                {tag.name}
              </Chip>
            ))}
            {tags.length === 0 && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('notes.noTags')}
              </Text>
            )}
          </View>
          <Button mode="contained" onPress={() => setTagsModalVisible(false)}>
            {t('common.done')}
          </Button>
        </Modal>
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeChip: {
    marginRight: 8,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    padding: 0,
  },
  contentInput: {
    fontSize: 16,
    minHeight: 200,
    padding: 0,
    lineHeight: 24,
  },
  // Checklist styles
  checklistContainer: {
    flex: 1,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checklistItemText: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  checklistItemTextChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  // Voice styles
  voiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  recordButton: {
    marginTop: 24,
  },
  // Linked sections
  linkedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  linkedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  linkedChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  // Color menu
  colorMenu: {
    padding: 12,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#000',
  },
  // Modal styles
  modal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  dateTimeText: {
    marginLeft: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default NoteEditScreen;
