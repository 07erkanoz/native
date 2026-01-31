/**
 * LifeCall - Arama Geçmişi Öğesi Bileşeni
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme';
import { CALL_COLORS } from '../theme/colors';
import Avatar from './Avatar';
import { CallLogEntry, CallType } from '../types';

interface CallLogItemProps {
  call: CallLogEntry;
  onPress?: () => void;
  onCallPress?: () => void;
}

const CallLogItem: React.FC<CallLogItemProps> = ({
  call,
  onPress,
  onCallPress,
}) => {
  const { theme } = useAppTheme();

  // Arama türü ikonu ve rengi
  const getCallTypeIcon = (type: CallType) => {
    const icons: Record<CallType, { name: string; color: string }> = {
      incoming: { name: 'call-received', color: CALL_COLORS.incoming },
      outgoing: { name: 'call-made', color: CALL_COLORS.outgoing },
      missed: { name: 'call-missed', color: CALL_COLORS.missed },
      rejected: { name: 'call-missed', color: CALL_COLORS.rejected },
      blocked: { name: 'phone-off', color: CALL_COLORS.blocked },
    };
    return icons[type];
  };

  const callTypeInfo = getCallTypeIcon(call.callType);

  // Süre formatı
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar
        name={call.contactName || call.phoneNumber}
        photoUri={call.contactPhoto}
        size="medium"
      />

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text
            variant="bodyLarge"
            style={[
              styles.name,
              {
                color: call.callType === 'missed'
                  ? CALL_COLORS.missed
                  : theme.colors.onSurface,
                fontWeight: call.isNew ? '700' : '500',
              },
            ]}
            numberOfLines={1}
          >
            {call.contactName || call.formattedNumber || call.phoneNumber}
          </Text>

          {call.hasNote && (
            <MaterialCommunityIcons
              name="note-text"
              size={16}
              color={theme.colors.tertiary}
              style={styles.noteIcon}
            />
          )}
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name={callTypeInfo.name}
            size={16}
            color={callTypeInfo.color}
          />
          <Text
            variant="bodySmall"
            style={[styles.detail, { color: theme.colors.onSurfaceVariant }]}
          >
            {call.callTime}
            {call.duration > 0 && ` • ${formatDuration(call.duration)}`}
          </Text>
        </View>
      </View>

      <IconButton
        icon="phone"
        size={24}
        iconColor={theme.colors.primary}
        onPress={onCallPress}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
  },
  noteIcon: {
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detail: {
    marginLeft: 4,
  },
});

export default CallLogItem;
