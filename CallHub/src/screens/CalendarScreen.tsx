/**
 * LifeCall - Takvim Ekranı
 *
 * Samsung Calendar benzeri UI:
 * - Aylık görünüm (etkinlik başlıkları günlerin üzerinde)
 * - Haftalık görünüm (saat grid'i ile)
 * - Günlük görünüm (agenda listesi)
 * - Alt sekmeler (Year/Month/Week/Day)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  FAB,
  IconButton,
  Surface,
  Divider,
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
  differenceInDays,
  getHours,
  getMinutes,
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
} from '../store/slices/calendarSlice';
import { CalendarViewMode, CalendarEvent, EVENT_COLORS } from '../types/calendar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 16) / 7;
const HOUR_HEIGHT = 60;

// Haftanın günleri
const WEEK_DAYS_TR = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
const WEEK_DAYS_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

type ViewTab = 'year' | 'month' | 'week' | 'day';

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
  const [activeTab, setActiveTab] = useState<ViewTab>('month');

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
    const firstDayOfWeek = settings.firstDayOfWeek === 0 ? 0 : 1; // 0 = Pazar, 1 = Pazartesi
    const start = startOfWeek(monthStart, { weekStartsOn: firstDayOfWeek as 0 | 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: firstDayOfWeek as 0 | 1 });

    const days = eachDayOfInterval({ start, end });
    while (days.length < 42) {
      days.push(addDays(days[days.length - 1], 1));
    }

    return days.slice(0, 42);
  }, [monthStart, monthEnd, settings.firstDayOfWeek]);

  // Haftalık görünüm için günler
  const weekDaysForView = useMemo(() => {
    const firstDayOfWeek = settings.firstDayOfWeek === 0 ? 0 : 1;
    const start = startOfWeek(selectedDateObj, { weekStartsOn: firstDayOfWeek as 0 | 1 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [selectedDateObj, settings.firstDayOfWeek]);

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
    return getEventsForDay(selectedDateObj).sort((a, b) => {
      return a.startDate.localeCompare(b.startDate);
    });
  }, [selectedDateObj, getEventsForDay]);

  // "X days ago" hesapla
  const daysAgoText = useMemo(() => {
    const diff = differenceInDays(new Date(), selectedDateObj);
    if (diff === 0) return t('common.today');
    if (diff === 1) return t('common.yesterday');
    if (diff === -1) return t('common.tomorrow');
    if (diff > 0) return `${diff} ${t('calendar.daysAgo') || 'days ago'}`;
    return `${Math.abs(diff)} ${t('calendar.daysLater') || 'days later'}`;
  }, [selectedDateObj, t]);

  // Navigasyon
  const handlePrevious = useCallback(() => {
    if (activeTab === 'month' || activeTab === 'year') {
      dispatch(goToPreviousMonth());
    } else if (activeTab === 'week') {
      const prevWeek = subWeeks(selectedDateObj, 1);
      dispatch(selectDate(format(prevWeek, 'yyyy-MM-dd')));
    } else {
      const prevDay = subDays(selectedDateObj, 1);
      dispatch(selectDate(format(prevDay, 'yyyy-MM-dd')));
    }
  }, [dispatch, activeTab, selectedDateObj]);

  const handleNext = useCallback(() => {
    if (activeTab === 'month' || activeTab === 'year') {
      dispatch(goToNextMonth());
    } else if (activeTab === 'week') {
      const nextWeek = addWeeks(selectedDateObj, 1);
      dispatch(selectDate(format(nextWeek, 'yyyy-MM-dd')));
    } else {
      const nextDay = addDays(selectedDateObj, 1);
      dispatch(selectDate(format(nextDay, 'yyyy-MM-dd')));
    }
  }, [dispatch, activeTab, selectedDateObj]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      dispatch(selectDate(format(date, 'yyyy-MM-dd')));
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

  // Aylık görünüm - gün hücresi
  const renderMonthDayCell = useCallback(
    (date: Date, index: number) => {
      const isCurrentMonth = isSameMonth(date, selectedDateObj);
      const isSelected = isSameDay(date, selectedDateObj);
      const isTodayDate = isToday(date);
      const dayEvents = getEventsForDay(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      return (
        <TouchableOpacity
          key={index}
          style={styles.monthDayCell}
          onPress={() => handleDateSelect(date)}
          activeOpacity={0.7}
        >
          {/* Gün numarası */}
          <View style={styles.dayNumberContainer}>
            <View
              style={[
                styles.dayNumberCircle,
                isTodayDate && { backgroundColor: theme.colors.primary },
                isSelected && !isTodayDate && {
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                  backgroundColor: 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.monthDayNumber,
                  {
                    color: isTodayDate
                      ? theme.colors.onPrimary
                      : !isCurrentMonth
                      ? theme.colors.onSurfaceDisabled
                      : isWeekend
                      ? theme.colors.primary
                      : theme.colors.onSurface,
                  },
                ]}
              >
                {format(date, 'd')}
              </Text>
            </View>
          </View>

          {/* Etkinlik başlıkları */}
          <View style={styles.dayEventsContainer}>
            {dayEvents.slice(0, 2).map((event, i) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventTag,
                  { backgroundColor: EVENT_COLORS[event.color || 'blue'] },
                ]}
                onPress={() => handleEventPress(event)}
              >
                <Text style={styles.eventTagText} numberOfLines={1}>
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
            {dayEvents.length > 2 && (
              <Text style={[styles.moreEventsText, { color: theme.colors.primary }]}>
                +{dayEvents.length - 2}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedDateObj, theme, getEventsForDay, handleDateSelect, handleEventPress]
  );

  // Haftalık görünüm
  const renderWeekView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <View style={styles.weekViewContainer}>
        {/* Gün başlıkları */}
        <View style={styles.weekHeader}>
          <View style={styles.weekTimeColumn} />
          {weekDaysForView.map((date, index) => {
            const isTodayDate = isToday(date);
            const isSelected = isSameDay(date, selectedDateObj);
            return (
              <TouchableOpacity
                key={index}
                style={styles.weekDayHeader}
                onPress={() => handleDateSelect(date)}
              >
                <Text style={[styles.weekDayName, { color: theme.colors.onSurfaceVariant }]}>
                  {weekDays[index]}
                </Text>
                <View
                  style={[
                    styles.weekDayNumberCircle,
                    isTodayDate && { backgroundColor: theme.colors.primary },
                    isSelected && !isTodayDate && {
                      borderWidth: 2,
                      borderColor: theme.colors.primary
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.weekDayNumber,
                      { color: isTodayDate ? theme.colors.onPrimary : theme.colors.onSurface },
                    ]}
                  >
                    {format(date, 'd')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Saat grid'i */}
        <ScrollView style={styles.weekGrid} showsVerticalScrollIndicator={false}>
          {hours.map((hour) => (
            <View key={hour} style={styles.hourRow}>
              <View style={styles.weekTimeColumn}>
                <Text style={[styles.hourText, { color: theme.colors.onSurfaceVariant }]}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </View>
              {weekDaysForView.map((date, dayIndex) => {
                const dayEvents = getEventsForDay(date).filter((event) => {
                  const eventHour = getHours(parseISO(event.startDate));
                  return eventHour === hour;
                });
                return (
                  <View
                    key={dayIndex}
                    style={[
                      styles.hourCell,
                      { borderColor: theme.colors.outlineVariant },
                    ]}
                  >
                    {dayEvents.map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.weekEventBlock,
                          { backgroundColor: EVENT_COLORS[event.color || 'blue'] },
                        ]}
                        onPress={() => handleEventPress(event)}
                      >
                        <Text style={styles.weekEventText} numberOfLines={2}>
                          {event.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Günlük görünüm (agenda)
  const renderDayView = () => (
    <ScrollView style={styles.dayViewContainer} showsVerticalScrollIndicator={false}>
      {selectedDayEvents.length === 0 ? (
        <View style={styles.noEventsContainer}>
          <MaterialCommunityIcons
            name="calendar-blank-outline"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.noEventsText, { color: theme.colors.onSurfaceVariant }]}>
            {t('calendar.noEvents')}
          </Text>
        </View>
      ) : (
        selectedDayEvents.map((event) => {
          const startTime = format(parseISO(event.startDate), 'HH:mm');
          const endTime = format(parseISO(event.endDate), 'HH:mm');
          const eventColor = EVENT_COLORS[event.color || 'blue'];

          return (
            <TouchableOpacity
              key={event.id}
              style={[styles.dayEventCard, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={() => handleEventPress(event)}
            >
              <View style={[styles.dayEventColorBar, { backgroundColor: eventColor }]} />
              <View style={styles.dayEventContent}>
                <Text style={[styles.dayEventTitle, { color: theme.colors.onSurface }]}>
                  {event.title}
                </Text>
                <Text style={[styles.dayEventTime, { color: theme.colors.onSurfaceVariant }]}>
                  {event.allDay ? t('calendar.allDay') : `${startTime}-${endTime}`}
                  {event.location && ` | ${event.location.address || event.location.placeName}`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );

  // Etkinlik listesi (ay görünümünde alt kısım)
  const renderEventsList = () => (
    <View style={[styles.eventsListContainer, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.eventsListHandle} />

      {selectedDayEvents.length === 0 ? (
        <View style={styles.emptyEventsList}>
          <Text style={[styles.noEventsSmall, { color: theme.colors.onSurfaceVariant }]}>
            {t('calendar.noEvents')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.eventsListScroll} showsVerticalScrollIndicator={false}>
          {selectedDayEvents.map((event) => {
            const startTime = format(parseISO(event.startDate), 'HH:mm');
            const endTime = format(parseISO(event.endDate), 'HH:mm');
            const eventColor = EVENT_COLORS[event.color || 'blue'];

            return (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventListItem, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() => handleEventPress(event)}
              >
                <View style={[styles.eventListDot, { backgroundColor: eventColor }]} />
                <View style={styles.eventListContent}>
                  <Text style={[styles.eventListTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={[styles.eventListTime, { color: theme.colors.onSurfaceVariant }]}>
                    {event.allDay ? t('calendar.allDay') : `${startTime}-${endTime}`}
                    {event.location && ` | ${event.location.address || event.location.placeName}`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]}>
              {format(selectedDateObj, 'yyyy / M', { locale })}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {daysAgoText}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <IconButton
              icon="plus"
              size={24}
              onPress={handleAddEvent}
            />
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => navigation.navigate('SettingsCalendar' as never)}
            />
          </View>
        </View>
      </View>

      {/* Haftanın günleri başlığı (aylık görünümde) */}
      {activeTab === 'month' && (
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayLabelCell}>
              <Text
                style={[
                  styles.weekDayLabel,
                  {
                    color: index >= 5
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  },
                ]}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* İçerik */}
      {activeTab === 'month' && (
        <>
          {/* Aylık takvim grid'i */}
          <View style={styles.monthGrid}>
            {calendarDays.map((date, index) => renderMonthDayCell(date, index))}
          </View>

          {/* Etkinlik listesi */}
          {renderEventsList()}
        </>
      )}

      {activeTab === 'week' && renderWeekView()}

      {activeTab === 'day' && (
        <View style={styles.dayViewWrapper}>
          <Text style={[styles.dayViewTitle, { color: theme.colors.onBackground }]}>
            {format(selectedDateObj, 'EEEE, d MMMM yyyy', { locale })}
          </Text>
          {renderDayView()}
        </View>
      )}

      {/* Alt sekmeler */}
      <View style={[styles.bottomTabs, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => setActiveTab('year')}
        >
          <MaterialCommunityIcons
            name="calendar-blank-multiple"
            size={24}
            color={activeTab === 'year' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.bottomTabText,
              { color: activeTab === 'year' ? theme.colors.primary : theme.colors.onSurfaceVariant },
            ]}
          >
            {t('calendar.year') || 'Year'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => setActiveTab('month')}
        >
          <MaterialCommunityIcons
            name="calendar-month"
            size={24}
            color={activeTab === 'month' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.bottomTabText,
              { color: activeTab === 'month' ? theme.colors.primary : theme.colors.onSurfaceVariant },
            ]}
          >
            {t('calendar.month') || 'Month'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => setActiveTab('week')}
        >
          <MaterialCommunityIcons
            name="calendar-week"
            size={24}
            color={activeTab === 'week' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.bottomTabText,
              { color: activeTab === 'week' ? theme.colors.primary : theme.colors.onSurfaceVariant },
            ]}
          >
            {t('calendar.week') || 'Week'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => setActiveTab('day')}
        >
          <MaterialCommunityIcons
            name="calendar-today"
            size={24}
            color={activeTab === 'day' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.bottomTabText,
              { color: activeTab === 'day' ? theme.colors.primary : theme.colors.onSurfaceVariant },
            ]}
          >
            {t('calendar.day') || 'Day'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bugün FAB */}
      {!isToday(selectedDateObj) && (
        <FAB
          icon="calendar-today"
          style={[
            styles.todayFab,
            { backgroundColor: theme.colors.primary, bottom: insets.bottom + 70 },
          ]}
          color={theme.colors.onPrimary}
          size="small"
          onPress={() => dispatch(goToToday())}
          label={format(new Date(), 'd')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  headerRight: {
    flexDirection: 'row',
  },
  weekDaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  weekDayLabelCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  monthDayCell: {
    width: DAY_WIDTH,
    minHeight: 80,
    paddingVertical: 2,
  },
  dayNumberContainer: {
    alignItems: 'center',
    marginBottom: 2,
  },
  dayNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayEventsContainer: {
    flex: 1,
    paddingHorizontal: 1,
  },
  eventTag: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 1,
  },
  eventTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '500',
  },
  moreEventsText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  eventsListContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 8,
    paddingTop: 8,
  },
  eventsListHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  emptyEventsList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEventsSmall: {
    fontSize: 14,
  },
  eventsListScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  eventListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  eventListDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  eventListContent: {
    flex: 1,
  },
  eventListTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventListTime: {
    fontSize: 13,
    marginTop: 2,
  },
  // Week view styles
  weekViewContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  weekTimeColumn: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  weekDayNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  weekGrid: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
  },
  hourText: {
    fontSize: 11,
  },
  hourCell: {
    flex: 1,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  weekEventBlock: {
    borderRadius: 4,
    padding: 4,
    margin: 1,
    minHeight: 40,
  },
  weekEventText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  // Day view styles
  dayViewWrapper: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dayViewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
  },
  dayViewContainer: {
    flex: 1,
  },
  noEventsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noEventsText: {
    fontSize: 16,
    marginTop: 12,
  },
  dayEventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dayEventColorBar: {
    width: 4,
  },
  dayEventContent: {
    flex: 1,
    padding: 16,
  },
  dayEventTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayEventTime: {
    fontSize: 14,
    marginTop: 4,
  },
  // Bottom tabs
  bottomTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomTabText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  todayFab: {
    position: 'absolute',
    right: 16,
  },
});

export default CalendarScreen;
