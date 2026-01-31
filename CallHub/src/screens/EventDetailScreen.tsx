/**
 * LifeCall - Etkinlik Detay Ekranı
 *
 * Etkinlik detaylarını görüntüleme:
 * - Başlık, tarih/saat, açıklama
 * - Konum (haritada aç)
 * - Hatırlatıcılar
 * - Arama hatırlatıcısı (doğrudan ara)
 * - Paylaşım
 * - Düzenleme/Silme
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Share,
} from 'react-native';
import {
  Text,
  Button,
  IconButton,
  Surface,
  Divider,
  Chip,
  FAB,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { format, parseISO, differenceInMinutes, isSameDay } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import { useAppTheme } from '../theme';
import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from '../navigation/types';
import { deleteEvent } from '../store/slices/calendarSlice';
import { CalendarEvent, EVENT_COLORS, REMINDER_OPTIONS } from '../types/calendar';

type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;

const EventDetailScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<EventDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();

  const { eventId } = route.params;

  // Redux state
  const { events, calendars } = useSelector((state: RootState) => state.calendar);

  // Etkinliği bul
  const event = useMemo(() => {
    return events.find((e) => e.id === eventId);
  }, [eventId, events]);

  // Takvimi bul
  const calendar = useMemo(() => {
    if (!event) return null;
    return calendars.find((c) => c.id === event.calendarId);
  }, [event, calendars]);

  // Locale
  const locale = i18n.language === 'tr' ? tr : enUS;

  // Etkinlik bulunamadıysa geri dön
  useEffect(() => {
    if (!event) {
      navigation.goBack();
    }
  }, [event, navigation]);

  if (!event) {
    return null;
  }

  // Tarih formatı
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const sameDay = isSameDay(startDate, endDate);

  const dateTimeText = useMemo(() => {
    if (event.allDay) {
      if (sameDay) {
        return format(startDate, 'EEEE, d MMMM yyyy', { locale });
      }
      return `${format(startDate, 'd MMMM', { locale })} - ${format(endDate, 'd MMMM yyyy', { locale })}`;
    }

    if (sameDay) {
      return `${format(startDate, 'EEEE, d MMMM yyyy', { locale })}\n${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
    }

    return `${format(startDate, 'd MMMM HH:mm', { locale })} -\n${format(endDate, 'd MMMM yyyy HH:mm', { locale })}`;
  }, [event, startDate, endDate, sameDay, locale]);

  // Süre hesapla
  const durationText = useMemo(() => {
    if (event.allDay) return t('calendar.allDay');

    const minutes = differenceInMinutes(endDate, startDate);
    if (minutes < 60) {
      return `${minutes} ${i18n.language === 'tr' ? 'dakika' : 'minutes'}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${i18n.language === 'tr' ? 'saat' : 'hours'}`;
    }
    return `${hours} ${i18n.language === 'tr' ? 'saat' : 'h'} ${remainingMinutes} ${i18n.language === 'tr' ? 'dk' : 'min'}`;
  }, [event, startDate, endDate, t, i18n.language]);

  // Hatırlatıcı metni
  const getReminderText = useCallback(
    (minutes: number) => {
      const option = REMINDER_OPTIONS.find((o) => o.minutes === minutes);
      if (option) {
        return t(`calendar.reminderOptions.${option.label}`);
      }
      if (minutes < 60) {
        return `${minutes} ${i18n.language === 'tr' ? 'dakika önce' : 'minutes before'}`;
      }
      if (minutes < 1440) {
        return `${Math.floor(minutes / 60)} ${i18n.language === 'tr' ? 'saat önce' : 'hours before'}`;
      }
      return `${Math.floor(minutes / 1440)} ${i18n.language === 'tr' ? 'gün önce' : 'days before'}`;
    },
    [t, i18n.language]
  );

  // Tekrarlama metni
  const recurrenceText = useMemo(() => {
    if (!event.recurrence) return null;
    return t(`calendar.recurrenceOptions.${event.recurrence.frequency}`);
  }, [event, t]);

  // Konum açma
  const handleOpenLocation = useCallback(() => {
    if (!event.location) return;

    const { latitude, longitude, placeName, address } = event.location;

    if (latitude && longitude) {
      const url = Platform.select({
        ios: `maps:${latitude},${longitude}?q=${encodeURIComponent(placeName || address || '')}`,
        android: `geo:${latitude},${longitude}?q=${encodeURIComponent(placeName || address || '')}`,
      });
      if (url) {
        Linking.openURL(url);
      }
    } else if (address) {
      const url = Platform.select({
        ios: `maps:?q=${encodeURIComponent(address)}`,
        android: `geo:0,0?q=${encodeURIComponent(address)}`,
      });
      if (url) {
        Linking.openURL(url);
      }
    }
  }, [event]);

  // Arama yap
  const handleMakeCall = useCallback(() => {
    if (!event.linkedPhoneNumber) return;

    const phoneUrl = `tel:${event.linkedPhoneNumber}`;
    Linking.openURL(phoneUrl);
  }, [event]);

  // Paylaş
  const handleShare = useCallback(async () => {
    try {
      const shareMessage = [
        event.title,
        '',
        `📅 ${dateTimeText.replace('\n', ' ')}`,
        event.location && `📍 ${event.location.placeName || event.location.address}`,
        event.description && `\n${event.description}`,
      ]
        .filter(Boolean)
        .join('\n');

      await Share.share({
        message: shareMessage,
        title: event.title,
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  }, [event, dateTimeText]);

  // Düzenle
  const handleEdit = useCallback(() => {
    navigation.navigate('EventEdit' as never, { eventId: event.id } as never);
  }, [event, navigation]);

  // Sil
  const handleDelete = useCallback(() => {
    Alert.alert(t('calendar.deleteEvent'), t('calendar.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          dispatch(deleteEvent(event.id));
          navigation.goBack();
        },
      },
    ]);
  }, [event, dispatch, navigation, t]);

  const eventColor = EVENT_COLORS[event.color || 'blue'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Renkli Banner */}
      <View style={[styles.colorBanner, { backgroundColor: eventColor }]}>
        <View style={[styles.headerOverlay, { paddingTop: insets.top }]}>
          <IconButton
            icon="arrow-left"
            iconColor="#FFFFFF"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerActions}>
            <IconButton icon="share-variant" iconColor="#FFFFFF" onPress={handleShare} />
            <IconButton icon="pencil" iconColor="#FFFFFF" onPress={handleEdit} />
            <IconButton icon="delete" iconColor="#FFFFFF" onPress={handleDelete} />
          </View>
        </View>

        <View style={styles.bannerContent}>
          <Text variant="headlineMedium" style={styles.eventTitle}>
            {event.title}
          </Text>
          {event.allDay && (
            <Chip
              style={styles.allDayChip}
              textStyle={{ color: '#FFFFFF' }}
              compact
            >
              {t('calendar.allDay')}
            </Chip>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tarih/Saat */}
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={24}
              color={eventColor}
            />
            <View style={styles.detailContent}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {dateTimeText}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {durationText}
              </Text>
            </View>
          </View>

          {/* Tekrarlama */}
          {recurrenceText && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.detailRow}>
                <MaterialCommunityIcons
                  name="repeat"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
                <View style={styles.detailContent}>
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {recurrenceText}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Surface>

        {/* Konum */}
        {event.location && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <TouchableOpacity style={styles.detailRow} onPress={handleOpenLocation}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={theme.colors.error}
              />
              <View style={styles.detailContent}>
                {event.location.placeName && (
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                    {event.location.placeName}
                  </Text>
                )}
                {event.location.address && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {event.location.address}
                  </Text>
                )}
              </View>
              <IconButton
                icon="directions"
                iconColor={theme.colors.primary}
                onPress={handleOpenLocation}
              />
            </TouchableOpacity>
          </Surface>
        )}

        {/* Arama Hatırlatıcısı */}
        {event.isCallReminder && event.linkedPhoneNumber && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <TouchableOpacity style={styles.detailRow} onPress={handleMakeCall}>
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.detailContent}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {t('calendar.callReminder')}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {event.linkedPhoneNumber}
                </Text>
              </View>
              <Button mode="contained" onPress={handleMakeCall} icon="phone">
                {t('contacts.actions.call')}
              </Button>
            </TouchableOpacity>
          </Surface>
        )}

        {/* Hatırlatıcılar */}
        {event.reminders && event.reminders.length > 0 && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="bell"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('calendar.reminders')}
              </Text>
            </View>
            <View style={styles.chipContainer}>
              {event.reminders.map((reminder) => (
                <Chip key={reminder.id} style={styles.reminderChip} icon="bell-outline">
                  {getReminderText(reminder.minutes)}
                </Chip>
              ))}
            </View>
          </Surface>
        )}

        {/* Açıklama */}
        {event.description && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="text"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('calendar.description')}
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 8 }}>
              {event.description}
            </Text>
          </Surface>
        )}

        {/* Notlar */}
        {event.notes && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="note-text"
                size={24}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {t('calendar.notes')}
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 8 }}>
              {event.notes}
            </Text>
          </Surface>
        )}

        {/* Takvim Bilgisi */}
        {calendar && (
          <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <View style={styles.detailRow}>
              <View style={[styles.calendarDot, { backgroundColor: calendar.color }]} />
              <View style={styles.detailContent}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {calendar.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {calendar.accountName || t('calendar.calendar')}
                </Text>
              </View>
            </View>
          </Surface>
        )}

        {/* Alt boşluk */}
        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>

      {/* FAB - Düzenle */}
      <FAB
        icon="pencil"
        style={[
          styles.fab,
          { backgroundColor: eventColor, bottom: insets.bottom + 16 },
        ]}
        color="#FFFFFF"
        onPress={handleEdit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  colorBanner: {
    minHeight: 180,
  },
  headerOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 24,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  allDayChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  content: {
    flex: 1,
    padding: 16,
    marginTop: -16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  section: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginLeft: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    marginVertical: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  reminderChip: {
    marginBottom: 4,
  },
  calendarDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
});

export default EventDetailScreen;
