/**
 * LifeCall - Numara Çevirici Ekranı
 * Placeholder - Tam implementasyon daha sonra
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../theme';

const DialerScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const [number, setNumber] = React.useState('');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <IconButton
        icon="close"
        size={28}
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
      />
      <View style={styles.content}>
        <Text variant="displayMedium" style={{ color: theme.colors.onBackground }}>
          {number || 'Dialer'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 10,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DialerScreen;
