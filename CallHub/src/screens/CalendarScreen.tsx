/**
 * LifeCall - Takvim Ekranı
 *
 * Ana takvim görünümü:
 * - Aylık/Haftalık/Günlük görünümler
 * - Etkinlik listesi
 * - Hızlı etkinlik ekleme
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import {
  Text,
  FAB,
  Chip,
  IconButton,
  Surface,
  Divider,
  Menu,
  Badge,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getDay,
} from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import { useAppTheme } from '../theme';
import { RootState, AppDispatch } from '../store';
import {
  selectDate,
  setViewMode,
  goToNextMonth,
  goToPreviousMonth,
  goToToday,
  selectEventsByDate,
  selectVisibleEvents,
} from '../store/slices/calendarSlice';
import { CalendarViewMode, CalendarEvent, EVENT_COLORS } from '../types/calendar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 32) / 7;

// Haftanın günleri
const WEEK_DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const WEEK_DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CalendarScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const { selectedDate, viewMode, events, calendars, settings } = useSelector(
    (state: RootState) => state.calendar
  );

  // Local state
  const [viewMenuVisible, setViewMenuVisible] = useState(false);

  // Locale
  const locale = i18n.language === 'tr' ? tr : enUS;
  const weekDays = i18n.language === 'tr' ? WEEK_DAYS_TR : WEEK_DAYS_EN;

  // Seçili tarih
  const selectedDateObj = useMemo(() => parseISO(selectedDate), [selectedDate]);

  // Ay bilgisi
  const monthStart = useMemo(() => startOfMonth(selectedDateObj), [selectedDateObj]);
  const monthEnd = useMemo(() => endOfMonth(selectedDateObj), [selectedDateObj]);

  // Takvim günleri (6 haftalık grid için)
  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: settings.firstDayOfWeek as 0 | 1 | 6 });
    const end = endOfWeek(monthEnd, { weekStartsOn: settings.firstDayOfWeek as 0 | 1 | 6 });

    // 6 hafta için yeterli gün olsun
    const days = eachDayOfInterval({ start, end });
    while (days.length < 42) {
      days.push(addDays(days[days.length - 1], 1));
    }

    return days.slice(0, 42);
  }, [monthStart, monthEnd, settings.firstDayOfWeek]);

  // Görünür etkinlikler
  const visibleEvents = useMemo(() => {
    const visibleCalendarIds = calendars.filter((c) => c.isVisible).map((c) => c.id);
    return events.filter((e) => visibleCalendarIds.includes(e.calendarId));
  }, [events, calendars]);

  // Belirli bir gündeki etkinlikleri al
  const getEventsForDay = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return visibleEvents.filter((event) => {
        const eventStart = event.startDate.split('T')[0];
        const eventEnd = event.endDate.split('T')[0];
        return dateStr >= eventStart && dateStr <= eventEnd;
      });
    },
    [visibleEvents]
  );

  // Seçili gündeki etkinlikler
  const selectedDayEvents = useMemo(() => {
    return getEventsForDay(selectedDateObj);
  }, [selectedDateObj, getEventsForDay]);

  // Navigasyon fonksiyonları
  const handlePrevious = useCallback(() => {
    if (viewMode === 'month') {
      dispatch(goToPreviousMonth());
    } else if (viewMode === 'week') {
      const prevWeek = subWeeks(selectedDateObj, 1);
      dispatch(selectDate(format(prevWeek, 'yyyy-MM-dd')));
    } else {
      const prevDay = subDays(selectedDateObj, 1);
      dispatch(selectDate(format(prevDay, 'yyyy-MM-dd')));
    }
  }, [dispatch, viewMode, selectedDateObj]);

  const handleNext = useCallback(() => {
    if (viewMode === 'month') {
      dispatch(goToNextMonth());
    } else if (viewMode === 'week') {
      const nextWeek = addWeeks(selectedDateObj, 1);
      dispatch(selectDate(format(nextWeek, 'yyyy-MM-dd')));
    } else {
      const nextDay = addDays(selectedDateObj, 1);
      dispatch(selectDate(format(nextDay, 'yyyy-MM-dd')));
    }
  }, [dispatch, viewMode, selectedDateObj]);

  const handleToday = useCallback(() => {
    dispatch(goToToday());
  }, [dispatch]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      dispatch(selectDate(format(date, 'yyyy-MM-dd')));
    },
    [dispatch]
  );

  const handleViewModeChange = useCallback(
    (mode: CalendarViewMode) => {
      dispatch(setViewMode(mode));
      setViewMenuVisible(false);
    },
    [dispatch]
  );

  const handleEventPress = useCallback(
    (event: CalendarEvent) => {
      navigation.navigate('EventDetail' as never, { eventId: event.id } as never);
    },
    [navigation]
  );

  const handleAddEvent = useCallback(() => {
    navigation.navigate('EventEdit' as never, { date: selectedDate } as never);
  }, [navigation, selectedDate]);

  // Görünüm modu başlığı
  const viewModeTitle = useMemo(() => {
    switch (viewMode) {
      case 'month':
        return format(selectedDateObj, 'MMMM yyyy', { locale });
      case 'week':
        const weekStart = startOfWeek(selectedDateObj, { weekStartsOn: settings.firstDayOfWeek as 0 | 1 | 6 });
        const weekEnd = endOfWeek(selectedDateObj, { weekStartsOn: settings.firstDayOfWeek as 0 | 1 | 6 });
        return `${format(weekStart, 'd MMM', { locale })} - ${format(weekEnd, 'd MMM yyyy', { locale })}`;
      case 'day':
        return format(selectedDateObj, 'EEEE, d MMMM yyyy', { locale });
      case 'agenda':
        return t('calendar.agenda');
      default:
        return '';
    }
  }, [viewMode, selectedDateObj, locale, settings.firstDayOfWeek, t]);

  // Gün hücresi render
  const renderDayCell = useCallback(
    (date: Date, index: number) => {
      const isCurrentMonth = isSameMonth(date, selectedDateObj);
      const isSelected = isSameDay(date, selectedDateObj);
      const isTodayDate = isToday(date);
      const dayEvents = getEventsForDay(date);
      const hasEvents = dayEvents.length > 0;

      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.dayCell,
            isSelected && { backgroundColor: theme.colors.primaryContainer },
            isTodayDate && !isSelected && { borderColor: theme.colors.primary, borderWidth: 2 },
          ]}
          onPress={() => handleDateSelect(date)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dayNumber,
              {
                color: isCurrentMonth
                  ? isSelected
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurface
                  : theme.colors.onSurfaceVariant,
              },
              isTodayDate && { fontWeight: 'bold' },
            ]}
          >
            {format(date, 'd')}
          </Text>

          {/* Etkinlik noktaları */}
          {hasEvents && (
            <View style={styles.eventDotsContainer}>
              {dayEvents.slice(0, 3).map((event, i) => (
                <View
                  key={event.id}
                  style={[
                    styles.eventDot,
                    { backgroundColor: EVENT_COLORS[event.color || 'blue'] },
                  ]}
                />
              ))}
              {dayEvents.length > 3 && (
                <Text style={[styles.moreEventsText, { color: theme.colors.onSurfaceVariant }]}>
                  +{dayEvents.length - 3}
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedDateObj, theme, getEventsForDay, handleDateSelect]
  );

  // Etkinlik kartı render
  const renderEventCard = useCallback(
    (event: CalendarEvent) => {
      const startTime = format(parseISO(event.startDate), 'HH:mm');
      const endTime = format(parseISO(event.endDate), 'HH:mm');
      const eventColor = EVENT_COLORS[event.color || 'blue'];

      return (
        <TouchableOpacity
          key={event.id}
          style={[styles.eventCard, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={() => handleEventPress(event)}
          activeOpacity={0.7}
        >
          <View style={[styles.eventColorBar, { backgroundColor: eventColor }]} />
          <View style={styles.eventContent}>
            <Text
              variant="titleSmall"
              style={{ color: theme.colors.onSurface }}
              numberOfLines={1}
            >
              {event.title}
            </Text>
            {!event.allDay && (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {startTime} - {endTime}
              </Text>
            )}
            {event.allDay && (
              <Chip compact style={styles.allDayChip}>
                {t('calendar.allDay')}
              </Chip>
            )}
            {event.location && (
              <View style={styles.locationRow}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={14}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4 }}
                  numberOfLines={1}
                >
                  {event.location.placeName || event.location.address}
                </Text>
              </View>
            )}
            {event.isCallReminder && (
              <View style={styles.callReminderRow}>
                <MaterialCommunityIcons
                  name="phone"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.primary, marginLeft: 4 }}
                >
                  {t('calendar.callReminder')}
                </Text>
              </View>
            )}
          </View>
          <IconButton
            icon="chevron-right"
            size={20}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      );
    },
    [theme, handleEventPress, t]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.headerTop}>
          {/* Navigasyon */}
          <View style={styles.headerNav}>
            <IconButton icon="chevron-left" onPress={handlePrevious} />
            <TouchableOpacity onPress={handleToday} style={styles.headerTitleContainer}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                {viewModeTitle}
              </Text>
            </TouchableOpacity>
            <IconButton icon="chevron-right" onPress={handleNext} />
          </View>

          {/* Görünüm modu */}
          <Menu
            visible={viewMenuVisible}
            onDismiss={() => setViewMenuVisible(false)}
            anchor={
              <IconButton
                icon={
                  viewMode === 'month'
                    ? 'calendar-month'
                    : viewMode === 'week'
                    ? 'calendar-week'
                    : viewMode === 'day'
                    ? 'calendar-today'
                    : 'format-list-bulleted'
                }
                onPress={() => setViewMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              leadingIcon="calendar-month"
              title={t('calendar.monthView')}
              onPress={() => handleViewModeChange('month')}
            />
            <Menu.Item
              leadingIcon="calendar-week"
              title={t('calendar.weekView')}
              onPress={() => handleViewModeChange('week')}
            />
            <Menu.Item
              leadingIcon="calendar-today"
              title={t('calendar.dayView')}
              onPress={() => handleViewModeChange('day')}
            />
            <Menu.Item
              leadingIcon="format-list-bulleted"
              title={t('calendar.agenda')}
              onPress={() => handleViewModeChange('agenda')}
            />
          </Menu>
        </View>

        {/* Bugün butonu */}
        {!isToday(selectedDateObj) && (
          <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
            <Text style={{ color: theme.colors.primary }}>{t('calendar.today')}</Text>
          </TouchableOpacity>
        )}
      </Surface>

      {/* Takvim Grid */}
      {viewMode === 'month' && (
        <View style={styles.calendarGrid}>
          {/* Haftanın günleri başlığı */}
          <View style={styles.weekDaysHeader}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Gün hücreleri */}
          <View style={styles.daysGrid}>
            {calendarDays.map((date, index) => renderDayCell(date, index))}
          </View>
        </View>
      )}

      {/* Etkinlik Listesi */}
      <View style={[styles.eventsSection, { backgroundColor: theme.colors.background }]}>
        <View style={styles.eventsSectionHeader}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {format(selectedDateObj, 'd MMMM EEEE', { locale })}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {selectedDayEvents.length} {t('calendar.events')}
          </Text>
        </View>

        <Divider />

        {selectedDayEvents.length === 0 ? (
          <View style={styles.noEventsContainer}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
            >
              {t('calendar.noEvents')}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
            >
              {t('calendar.tapToAdd')}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
            {selectedDayEvents.map(renderEventCard)}
          </ScrollView>
        )}
      </View>

      {/* FAB - Etkinlik Ekle */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary, bottom: insets.bottom + 16 },
        ]}
        color={theme.colors.onPrimary}
        onPress={handleAddEvent}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  todayButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  calendarGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 4,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 14,
  },
  eventDotsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  moreEventsText: {
    fontSize: 8,
    marginLeft: 2,
  },
  eventsSection: {
    flex: 1,
    marginTop: 8,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 4,
    overflow: 'hidden',
  },
  eventColorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  eventContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  allDayChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  callReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
});

export default CalendarScreen;
