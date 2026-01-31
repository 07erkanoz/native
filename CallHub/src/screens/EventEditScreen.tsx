/**
 * LifeCall - Etkinlik Düzenleme/Oluşturma Ekranı
 *
 * Yeni etkinlik oluşturma veya mevcut etkinliği düzenleme:
 * - Başlık ve açıklama
 * - Tarih/saat seçimi
 * - Tüm gün etkinliği
 * - Konum seçimi (harita entegrasyonu)
 * - Hatırlatıcı ayarları
 * - Tekrarlama ayarları
 * - Renk seçimi
 * - Takvim seçimi
 * - Not ekleme
 * - Arama hatırlatıcısı (kişi seçimi)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Switch,
  IconButton,
  Surface,
  Divider,
  List,
  Menu,
  Portal,
  Modal,
  Chip,
  RadioButton,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  format,
  parseISO,
  addHours,
  setHours,
  setMinutes,
  isBefore,
  isAfter,
} from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import { useAppTheme } from '../theme';
import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from '../navigation/types';
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from '../store/slices/calendarSlice';
import {
  CalendarEvent,
  EventReminder,
  EventRecurrence,
  EventLocation,
  EVENT_COLORS,
  REMINDER_OPTIONS,
  CalendarEventColor,
} from '../types/calendar';

type EventEditRouteProp = RouteProp<RootStackParamList, 'EventEdit'>;

// Tekrarlama seçenekleri
const RECURRENCE_OPTIONS: { value: EventRecurrence['frequency'] | 'none'; label: string }[] = [
  { value: 'none', label: 'recurrenceOptions.none' },
  { value: 'daily', label: 'recurrenceOptions.daily' },
  { value: 'weekly', label: 'recurrenceOptions.weekly' },
  { value: 'monthly', label: 'recurrenceOptions.monthly' },
  { value: 'yearly', label: 'recurrenceOptions.yearly' },
];

// Renk seçenekleri
const COLOR_OPTIONS: CalendarEventColor[] = [
  'blue',
  'green',
  'red',
  'purple',
  'orange',
  'yellow',
  'teal',
  'pink',
];

const EventEditScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<EventEditRouteProp>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  // Route params
  const { eventId, date, contactId, isCallReminder: initialIsCallReminder } = route.params || {};

  // Redux state
  const { events, calendars, settings } = useSelector((state: RootState) => state.calendar);

  // Mevcut etkinliği bul
  const existingEvent = useMemo(() => {
    if (!eventId) return null;
    return events.find((e) => e.id === eventId) || null;
  }, [eventId, events]);

  // Varsayılan takvim
  const defaultCalendar = useMemo(() => {
    return calendars.find((c) => c.isDefault) || calendars[0];
  }, [calendars]);

  // Locale
  const locale = i18n.language === 'tr' ? tr : enUS;

  // Form state
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [allDay, setAllDay] = useState(existingEvent?.allDay || false);
  const [startDate, setStartDate] = useState<Date>(() => {
    if (existingEvent) {
      return parseISO(existingEvent.startDate);
    }
    if (date) {
      // Seçili tarihle yeni etkinlik
      const d = parseISO(date);
      return setMinutes(setHours(d, 9), 0);
    }
    // Şu anki saat + 1 saat
    const now = new Date();
    return setMinutes(addHours(now, 1), 0);
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    if (existingEvent) {
      return parseISO(existingEvent.endDate);
    }
    // Start + 1 saat
    return addHours(startDate, 1);
  });
  const [selectedCalendarId, setSelectedCalendarId] = useState(
    existingEvent?.calendarId || defaultCalendar?.id || 'local'
  );
  const [location, setLocation] = useState<EventLocation | undefined>(existingEvent?.location);
  const [reminders, setReminders] = useState<EventReminder[]>(
    existingEvent?.reminders || [{ id: '1', minutes: 15, type: 'notification' }]
  );
  const [recurrence, setRecurrence] = useState<EventRecurrence | undefined>(existingEvent?.recurrence);
  const [color, setColor] = useState<CalendarEventColor>(existingEvent?.color || 'blue');
  const [notes, setNotes] = useState(existingEvent?.notes || '');
  const [isCallReminder, setIsCallReminder] = useState(
    existingEvent?.isCallReminder || initialIsCallReminder || false
  );
  const [linkedContactId, setLinkedContactId] = useState(
    existingEvent?.linkedContactId || contactId
  );
  const [linkedPhoneNumber, setLinkedPhoneNumber] = useState(
    existingEvent?.linkedPhoneNumber || ''
  );

  // UI state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  // Ekran başlığı
  const screenTitle = existingEvent ? t('calendar.editEvent') : t('calendar.newEvent');

  // Başlangıç tarihi değiştiğinde bitiş tarihini ayarla
  useEffect(() => {
    if (isBefore(endDate, startDate)) {
      setEndDate(addHours(startDate, 1));
    }
  }, [startDate]);

  // Tarih/saat değişiklik handler'ları
  const handleStartDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowStartDatePicker(Platform.OS === 'ios');
      if (selectedDate) {
        const newDate = new Date(startDate);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setStartDate(newDate);
      }
    },
    [startDate]
  );

  const handleStartTimeChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowStartTimePicker(Platform.OS === 'ios');
      if (selectedDate) {
        const newDate = new Date(startDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        setStartDate(newDate);
      }
    },
    [startDate]
  );

  const handleEndDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowEndDatePicker(Platform.OS === 'ios');
      if (selectedDate) {
        const newDate = new Date(endDate);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setEndDate(newDate);
      }
    },
    [endDate]
  );

  const handleEndTimeChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowEndTimePicker(Platform.OS === 'ios');
      if (selectedDate) {
        const newDate = new Date(endDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        setEndDate(newDate);
      }
    },
    [endDate]
  );

  // Hatırlatıcı ekleme
  const handleAddReminder = useCallback((minutes: number) => {
    const newReminder: EventReminder = {
      id: Date.now().toString(),
      minutes,
      type: 'notification',
    };
    setReminders((prev) => [...prev, newReminder]);
    setShowReminderModal(false);
  }, []);

  // Hatırlatıcı silme
  const handleRemoveReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Tekrarlama ayarı
  const handleSetRecurrence = useCallback((frequency: EventRecurrence['frequency'] | 'none') => {
    if (frequency === 'none') {
      setRecurrence(undefined);
    } else {
      setRecurrence({
        frequency,
        interval: 1,
      });
    }
    setShowRecurrenceModal(false);
  }, []);

  // Konum açma
  const handleOpenLocation = useCallback(() => {
    if (location?.latitude && location?.longitude) {
      const url = Platform.select({
        ios: `maps:${location.latitude},${location.longitude}?q=${encodeURIComponent(
          location.placeName || location.address || ''
        )}`,
        android: `geo:${location.latitude},${location.longitude}?q=${encodeURIComponent(
          location.placeName || location.address || ''
        )}`,
      });
      if (url) {
        Linking.openURL(url);
      }
    }
  }, [location]);

  // Kaydetme
  const handleSave = useCallback(async () => {
    // Validasyon
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('calendar.eventTitle') + ' ' + t('errors.required'));
      return;
    }

    if (isBefore(endDate, startDate) && !allDay) {
      Alert.alert(t('common.error'), t('calendar.endDate') + ' ' + t('errors.invalid'));
      return;
    }

    setSaving(true);

    try {
      const eventData: Partial<CalendarEvent> = {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate.toISOString(),
        endDate: allDay ? startDate.toISOString() : endDate.toISOString(),
        allDay,
        calendarId: selectedCalendarId,
        location,
        reminders,
        recurrence,
        color,
        notes: notes.trim() || undefined,
        isCallReminder,
        linkedContactId: isCallReminder ? linkedContactId : undefined,
        linkedPhoneNumber: isCallReminder ? linkedPhoneNumber : undefined,
        status: 'confirmed',
      };

      if (existingEvent) {
        // Güncelle
        dispatch(
          updateEvent({
            id: existingEvent.id,
            ...eventData,
          } as CalendarEvent)
        );
      } else {
        // Yeni oluştur
        const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...eventData,
        } as CalendarEvent;
        dispatch(createEvent(newEvent));
      }

      navigation.goBack();
    } catch (error) {
      console.error('Etkinlik kaydetme hatası:', error);
      Alert.alert(t('common.error'), t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }, [
    title,
    description,
    startDate,
    endDate,
    allDay,
    selectedCalendarId,
    location,
    reminders,
    recurrence,
    color,
    notes,
    isCallReminder,
    linkedContactId,
    linkedPhoneNumber,
    existingEvent,
    dispatch,
    navigation,
    t,
  ]);

  // Silme
  const handleDelete = useCallback(() => {
    if (!existingEvent) return;

    Alert.alert(t('calendar.deleteEvent'), t('calendar.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          dispatch(deleteEvent(existingEvent.id));
          navigation.goBack();
        },
      },
    ]);
  }, [existingEvent, dispatch, navigation, t]);

  // Hatırlatıcı metni
  const getReminderText = useCallback(
    (minutes: number) => {
      const option = REMINDER_OPTIONS.find((o) => o.minutes === minutes);
      if (option) {
        return t(`calendar.reminderOptions.${option.label}`);
      }
      if (minutes < 60) {
        return `${minutes} ${t('time.minutesAgo').replace('{{count}} ', '')}`;
      }
      if (minutes < 1440) {
        return `${Math.floor(minutes / 60)} ${t('time.hoursAgo').replace('{{count}} ', '')}`;
      }
      return `${Math.floor(minutes / 1440)} ${t('time.daysAgo').replace('{{count}} ', '')}`;
    },
    [t]
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.headerContent}>
          <IconButton icon="close" onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, flex: 1 }}>
            {screenTitle}
          </Text>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving || !title.trim()}
          >
            {t('common.save')}
          </Button>
        </View>
      </Surface>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Başlık */}
        <TextInput
          mode="outlined"
          label={t('calendar.eventTitle')}
          value={title}
          onChangeText={setTitle}
          style={styles.titleInput}
          autoFocus={!existingEvent}
        />

        {/* Tüm Gün */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.switchRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyLarge" style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
              {t('calendar.allDay')}
            </Text>
            <Switch value={allDay} onValueChange={setAllDay} />
          </View>

          <Divider style={styles.divider} />

          {/* Başlangıç Tarihi/Saati */}
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowStartDatePicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar-start"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <View style={styles.dateContent}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('calendar.startDate')}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {format(startDate, 'dd MMMM yyyy', { locale })}
              </Text>
            </View>
            {!allDay && (
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                  {format(startDate, 'HH:mm')}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <Divider style={styles.divider} />

          {/* Bitiş Tarihi/Saati */}
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowEndDatePicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar-end"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <View style={styles.dateContent}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('calendar.endDate')}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {format(endDate, 'dd MMMM yyyy', { locale })}
              </Text>
            </View>
            {!allDay && (
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                  {format(endDate, 'HH:mm')}
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </Surface>

        {/* Hatırlatıcılar */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              {t('calendar.reminders')}
            </Text>
          </View>

          {reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderItem}>
              <Chip
                onClose={() => handleRemoveReminder(reminder.id)}
                style={styles.reminderChip}
              >
                {getReminderText(reminder.minutes)}
              </Chip>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowReminderModal(true)}
          >
            <MaterialCommunityIcons
              name="plus"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="bodyMedium" style={{ color: theme.colors.primary, marginLeft: 8 }}>
              {t('calendar.addReminder')}
            </Text>
          </TouchableOpacity>
        </Surface>

        {/* Tekrarlama */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setShowRecurrenceModal(true)}
          >
            <MaterialCommunityIcons
              name="repeat"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <View style={styles.listItemContent}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {t('calendar.repeat')}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {recurrence
                  ? t(`calendar.recurrenceOptions.${recurrence.frequency}`)
                  : t('calendar.recurrenceOptions.none')}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </Surface>

        {/* Konum */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => {
              // TODO: Konum seçme ekranına git
              Alert.alert('Konum', 'Konum seçme özelliği yakında eklenecek');
            }}
          >
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <View style={styles.listItemContent}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {t('calendar.location')}
              </Text>
              {location ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {location.placeName || location.address}
                </Text>
              ) : (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('calendar.selectLocation')}
                </Text>
              )}
            </View>
            {location && (
              <IconButton
                icon="map-outline"
                size={20}
                onPress={handleOpenLocation}
              />
            )}
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </Surface>

        {/* Renk */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setShowColorModal(true)}
          >
            <View
              style={[styles.colorIndicator, { backgroundColor: EVENT_COLORS[color] }]}
            />
            <View style={styles.listItemContent}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {t('calendar.color')}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </Surface>

        {/* Takvim Seçimi */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <Menu
            visible={showCalendarMenu}
            onDismiss={() => setShowCalendarMenu(false)}
            anchor={
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => setShowCalendarMenu(true)}
              >
                <MaterialCommunityIcons
                  name="calendar"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
                <View style={styles.listItemContent}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {t('calendar.calendar')}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {calendars.find((c) => c.id === selectedCalendarId)?.name || 'Takvim'}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            }
          >
            {calendars.map((cal) => (
              <Menu.Item
                key={cal.id}
                title={cal.name}
                leadingIcon={() => (
                  <View
                    style={[styles.calendarColorDot, { backgroundColor: cal.color }]}
                  />
                )}
                onPress={() => {
                  setSelectedCalendarId(cal.id);
                  setShowCalendarMenu(false);
                }}
              />
            ))}
          </Menu>
        </Surface>

        {/* Arama Hatırlatıcısı */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.switchRow}>
            <MaterialCommunityIcons
              name="phone"
              size={24}
              color={isCallReminder ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            <View style={styles.switchContent}>
              <Text variant="bodyLarge" style={[styles.switchLabel, { color: theme.colors.onSurface }]}>
                {t('calendar.callReminder')}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('calendar.callReminderDesc')}
              </Text>
            </View>
            <Switch value={isCallReminder} onValueChange={setIsCallReminder} />
          </View>

          {isCallReminder && (
            <>
              <Divider style={styles.divider} />
              <TextInput
                mode="outlined"
                label={t('contacts.fields.phone')}
                value={linkedPhoneNumber}
                onChangeText={setLinkedPhoneNumber}
                keyboardType="phone-pad"
                style={styles.phoneInput}
                left={<TextInput.Icon icon="phone" />}
              />
            </>
          )}
        </Surface>

        {/* Açıklama */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <TextInput
            mode="outlined"
            label={t('calendar.description')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.descriptionInput}
          />
        </Surface>

        {/* Notlar */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <TextInput
            mode="outlined"
            label={t('calendar.notes')}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </Surface>

        {/* Silme Butonu (düzenleme modunda) */}
        {existingEvent && (
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            style={[styles.deleteButton, { borderColor: theme.colors.error }]}
            onPress={handleDelete}
            icon="delete"
          >
            {t('calendar.deleteEvent')}
          </Button>
        )}

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      {/* Date/Time Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          locale={i18n.language}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartTimeChange}
          is24Hour={true}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={startDate}
          locale={i18n.language}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndTimeChange}
          is24Hour={true}
        />
      )}

      {/* Hatırlatıcı Modal */}
      <Portal>
        <Modal
          visible={showReminderModal}
          onDismiss={() => setShowReminderModal(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('calendar.addReminder')}
          </Text>
          <ScrollView>
            {REMINDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.minutes}
                style={styles.modalOption}
                onPress={() => handleAddReminder(option.minutes)}
              >
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t(`calendar.reminderOptions.${option.label}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Tekrarlama Modal */}
      <Portal>
        <Modal
          visible={showRecurrenceModal}
          onDismiss={() => setShowRecurrenceModal(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('calendar.recurrence')}
          </Text>
          <RadioButton.Group
            value={recurrence?.frequency || 'none'}
            onValueChange={(value) =>
              handleSetRecurrence(value as EventRecurrence['frequency'] | 'none')
            }
          >
            {RECURRENCE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => handleSetRecurrence(option.value)}
              >
                <RadioButton value={option.value} />
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, marginLeft: 8 }}>
                  {t(`calendar.${option.label}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        </Modal>
      </Portal>

      {/* Renk Modal */}
      <Portal>
        <Modal
          visible={showColorModal}
          onDismiss={() => setShowColorModal(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            {t('calendar.color')}
          </Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((colorOption) => (
              <TouchableOpacity
                key={colorOption}
                style={[
                  styles.colorOption,
                  { backgroundColor: EVENT_COLORS[colorOption] },
                  color === colorOption && styles.colorOptionSelected,
                ]}
                onPress={() => {
                  setColor(colorOption);
                  setShowColorModal(false);
                }}
              >
                {color === colorOption && (
                  <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    marginBottom: 16,
    fontSize: 18,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginLeft: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchContent: {
    flex: 1,
    marginLeft: 12,
  },
  switchLabel: {
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    marginVertical: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateContent: {
    flex: 1,
    marginLeft: 12,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reminderItem: {
    marginBottom: 8,
  },
  reminderChip: {
    alignSelf: 'flex-start',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  calendarColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  phoneInput: {
    marginTop: 8,
  },
  descriptionInput: {
    minHeight: 80,
  },
  notesInput: {
    minHeight: 100,
  },
  deleteButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});

export default EventEditScreen;
