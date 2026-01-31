/**
 * LifeCall - Kurulum Sihirbazı Ekranı
 *
 * Uygulama ilk açılışta veya izinler eksikken gösterilir.
 * - Cihaz markasını algılar
 * - Gerekli izinleri kontrol eder
 * - Adım adım yönlendirme sağlar
 * - Marka bazlı özel talimatlar gösterir
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  NativeModules,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  IconButton,
  ProgressBar,
  List,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppTheme } from '../theme';
import { permissionsService } from '../services';

const { DefaultAppModule } = NativeModules;

// Cihaz marka tespiti
interface DeviceBrand {
  id: string;
  name: string;
  hasSpecialSettings: boolean;
  settingsPath?: string;
  instructions?: string[];
}

// Bilinen cihaz markaları ve özel ayarları
const DEVICE_BRANDS: DeviceBrand[] = [
  {
    id: 'samsung',
    name: 'Samsung',
    hasSpecialSettings: true,
    settingsPath: 'Ayarlar > Uygulamalar > LifeCall > Pil > İzin ver',
    instructions: [
      'Ayarlar uygulamasını açın',
      'Uygulamalar bölümüne gidin',
      'LifeCall\'u bulun ve seçin',
      'Pil seçeneğine gidin',
      'Arka planda çalışmaya izin verin',
      'Uyku modunda çalışmasına izin verin',
    ],
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi / Redmi / POCO',
    hasSpecialSettings: true,
    settingsPath: 'Ayarlar > Uygulamalar > İzinleri yönet > Otomatik başlatma',
    instructions: [
      'Ayarlar uygulamasını açın',
      'Uygulamalar bölümüne gidin',
      'İzinleri yönet seçeneğini seçin',
      'Otomatik başlatma sekmesine gidin',
      'LifeCall için otomatik başlatmayı etkinleştirin',
      'Pil tasarrufu > Kısıtlama yok seçin',
    ],
  },
  {
    id: 'huawei',
    name: 'Huawei / Honor',
    hasSpecialSettings: true,
    settingsPath: 'Ayarlar > Pil > Uygulama başlatma',
    instructions: [
      'Ayarlar uygulamasını açın',
      'Pil bölümüne gidin',
      'Uygulama başlatma seçeneğini seçin',
      'LifeCall\'u bulun',
      'Manuel yönetim seçeneğini açın',
      'Otomatik başlatma, ikincil başlatma ve arka planda çalışmayı etkinleştirin',
    ],
  },
  {
    id: 'oppo',
    name: 'OPPO / Realme',
    hasSpecialSettings: true,
    settingsPath: 'Ayarlar > Pil > Pil optimizasyonu',
    instructions: [
      'Ayarlar uygulamasını açın',
      'Pil bölümüne gidin',
      'Pil optimizasyonu seçeneğini seçin',
      'LifeCall\'u bulun',
      'Optimize etme seçeneğini seçin',
      'Arka planda çalışmasına izin verin',
    ],
  },
  {
    id: 'vivo',
    name: 'Vivo / iQOO',
    hasSpecialSettings: true,
    settingsPath: 'Ayarlar > Pil > Yüksek arka plan güç tüketimi',
    instructions: [
      'Ayarlar uygulamasını açın',
      'Pil bölümüne gidin',
      'Yüksek arka plan güç tüketimi seçeneğini seçin',
      'LifeCall\'u etkinleştirin',
    ],
  },
  {
    id: 'oneplus',
    name: 'OnePlus',
    hasSpecialSettings: true,
    settingsPath: 'Ayarlar > Pil > Pil optimizasyonu',
    instructions: [
      'Ayarlar uygulamasını açın',
      'Pil bölümüne gidin',
      'Pil optimizasyonu seçeneğini seçin',
      'Tüm uygulamalar seçeneğini seçin',
      'LifeCall\'u bulun ve "Optimize etme" seçin',
    ],
  },
  {
    id: 'other',
    name: 'Diğer',
    hasSpecialSettings: false,
    instructions: [
      'Ayarlar uygulamasını açın',
      'Uygulamalar bölümüne gidin',
      'LifeCall\'u bulun',
      'Pil optimizasyonunu devre dışı bırakın',
    ],
  },
];

// İzin durumu
interface PermissionStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  granted: boolean;
  required: boolean;
  checkFn: () => Promise<boolean>;
  requestFn: () => Promise<boolean>;
}

// Setup adımları
type SetupStep = 'welcome' | 'permissions' | 'defaultApp' | 'brand' | 'overlay' | 'complete';

interface Props {
  onComplete: () => void;
  onSkip?: () => void;
}

const SetupWizardScreen: React.FC<Props> = ({ onComplete, onSkip }) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  // State
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [permissions, setPermissions] = useState<PermissionStatus[]>([]);
  const [isDefaultDialer, setIsDefaultDialer] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const [detectedBrand, setDetectedBrand] = useState<DeviceBrand | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand | null>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cihaz markasını tespit et
  const detectDeviceBrand = useCallback(() => {
    if (Platform.OS !== 'android') return;

    const brand = Platform.constants?.Brand?.toLowerCase() || '';
    const manufacturer = Platform.constants?.Manufacturer?.toLowerCase() || '';

    let detected: DeviceBrand | null = null;

    if (brand.includes('samsung') || manufacturer.includes('samsung')) {
      detected = DEVICE_BRANDS.find((b) => b.id === 'samsung') || null;
    } else if (
      brand.includes('xiaomi') ||
      brand.includes('redmi') ||
      brand.includes('poco') ||
      manufacturer.includes('xiaomi')
    ) {
      detected = DEVICE_BRANDS.find((b) => b.id === 'xiaomi') || null;
    } else if (brand.includes('huawei') || brand.includes('honor') || manufacturer.includes('huawei')) {
      detected = DEVICE_BRANDS.find((b) => b.id === 'huawei') || null;
    } else if (brand.includes('oppo') || brand.includes('realme') || manufacturer.includes('oppo')) {
      detected = DEVICE_BRANDS.find((b) => b.id === 'oppo') || null;
    } else if (brand.includes('vivo') || brand.includes('iqoo') || manufacturer.includes('vivo')) {
      detected = DEVICE_BRANDS.find((b) => b.id === 'vivo') || null;
    } else if (brand.includes('oneplus') || manufacturer.includes('oneplus')) {
      detected = DEVICE_BRANDS.find((b) => b.id === 'oneplus') || null;
    } else {
      detected = DEVICE_BRANDS.find((b) => b.id === 'other') || null;
    }

    setDetectedBrand(detected);
    setSelectedBrand(detected);
  }, []);

  // İzinleri kontrol et
  const checkPermissions = useCallback(async () => {
    const permissionList: PermissionStatus[] = [
      {
        id: 'contacts',
        name: t('permissions.contacts') || 'Kişiler',
        description: 'Kişileri görüntülemek ve yönetmek için',
        icon: 'account-multiple',
        granted: false,
        required: true,
        checkFn: async () => permissionsService.checkContactsPermission(),
        requestFn: async () => permissionsService.requestContactsPermission(),
      },
      {
        id: 'phone',
        name: t('permissions.phone') || 'Telefon',
        description: 'Arama yapmak ve almak için',
        icon: 'phone',
        granted: false,
        required: true,
        checkFn: async () => permissionsService.checkPhonePermission(),
        requestFn: async () => permissionsService.requestPhonePermission(),
      },
      {
        id: 'callLog',
        name: t('calls.history') || 'Arama Geçmişi',
        description: 'Arama geçmişini görüntülemek için',
        icon: 'history',
        granted: false,
        required: true,
        checkFn: async () => permissionsService.checkCallLogPermission(),
        requestFn: async () => permissionsService.requestCallLogPermission(),
      },
      {
        id: 'notifications',
        name: t('settings.notifications.title') || 'Bildirimler',
        description: 'Gelen arama bildirimleri için',
        icon: 'bell',
        granted: false,
        required: true,
        checkFn: async () => permissionsService.checkNotificationPermission(),
        requestFn: async () => permissionsService.requestNotificationPermission(),
      },
    ];

    // Her izni kontrol et
    for (const perm of permissionList) {
      try {
        perm.granted = await perm.checkFn();
      } catch (error) {
        console.error(`İzin kontrol hatası (${perm.id}):`, error);
        perm.granted = false;
      }
    }

    setPermissions(permissionList);

    // Varsayılan dialer kontrolü
    try {
      if (DefaultAppModule) {
        const isDefault = await DefaultAppModule.isDefaultDialer();
        setIsDefaultDialer(isDefault);
      }
    } catch (error) {
      console.error('Varsayılan dialer kontrolü hatası:', error);
    }

    // Overlay izni kontrolü
    try {
      if (DefaultAppModule) {
        const hasOverlay = await DefaultAppModule.canDrawOverlays();
        setHasOverlayPermission(hasOverlay);
      }
    } catch (error) {
      console.error('Overlay izin kontrolü hatası:', error);
    }
  }, [t]);

  // İlk yükleme
  useEffect(() => {
    detectDeviceBrand();
    checkPermissions();
  }, [detectDeviceBrand, checkPermissions]);

  // İzin iste
  const requestPermission = async (permission: PermissionStatus) => {
    setIsLoading(true);
    try {
      const granted = await permission.requestFn();
      setPermissions((prev) =>
        prev.map((p) => (p.id === permission.id ? { ...p, granted } : p))
      );
    } catch (error) {
      console.error(`İzin isteği hatası (${permission.id}):`, error);
    }
    setIsLoading(false);
  };

  // Tüm izinleri iste
  const requestAllPermissions = async () => {
    setIsLoading(true);
    for (const permission of permissions) {
      if (!permission.granted) {
        try {
          const granted = await permission.requestFn();
          setPermissions((prev) =>
            prev.map((p) => (p.id === permission.id ? { ...p, granted } : p))
          );
        } catch (error) {
          console.error(`İzin isteği hatası (${permission.id}):`, error);
        }
      }
    }
    setIsLoading(false);
  };

  // Varsayılan dialer olarak ayarla
  const requestDefaultDialer = async () => {
    setIsLoading(true);
    try {
      if (DefaultAppModule) {
        const result = await DefaultAppModule.requestDefaultDialer();
        setIsDefaultDialer(result);
      }
    } catch (error) {
      console.error('Varsayılan dialer isteği hatası:', error);
    }
    setIsLoading(false);
  };

  // Overlay izni iste
  const requestOverlayPermission = async () => {
    setIsLoading(true);
    try {
      if (DefaultAppModule) {
        const result = await DefaultAppModule.requestOverlayPermission();
        setHasOverlayPermission(result);
      }
    } catch (error) {
      console.error('Overlay izin isteği hatası:', error);
    }
    setIsLoading(false);
  };

  // Ayarlara yönlendir
  const openSettings = () => {
    Linking.openSettings();
  };

  // İlerleme hesapla
  const progress = useMemo(() => {
    const steps: SetupStep[] = ['welcome', 'permissions', 'defaultApp', 'brand', 'overlay', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    return (currentIndex + 1) / steps.length;
  }, [currentStep]);

  // Tüm izinler verildi mi?
  const allPermissionsGranted = useMemo(() => {
    return permissions.every((p) => !p.required || p.granted);
  }, [permissions]);

  // Sonraki adıma geç
  const nextStep = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('permissions');
        break;
      case 'permissions':
        setCurrentStep('defaultApp');
        break;
      case 'defaultApp':
        if (detectedBrand?.hasSpecialSettings) {
          setCurrentStep('brand');
        } else {
          setCurrentStep('overlay');
        }
        break;
      case 'brand':
        setCurrentStep('overlay');
        break;
      case 'overlay':
        setCurrentStep('complete');
        break;
      case 'complete':
        handleComplete();
        break;
    }
  };

  // Kurulum tamamlandı
  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('setupCompleted', 'true');
    } catch (error) {
      console.error('Setup kaydetme hatası:', error);
    }
    onComplete();
  };

  // Atla
  const handleSkip = () => {
    Alert.alert(
      'Kurulumu Atla',
      'Bazı özellikler düzgün çalışmayabilir. Yine de atlamak istiyor musunuz?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, Atla',
          style: 'destructive',
          onPress: () => {
            if (onSkip) onSkip();
            else handleComplete();
          },
        },
      ]
    );
  };

  // Render: Hoşgeldin adımı
  const renderWelcomeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeIcon}>
        <MaterialCommunityIcons name="phone-check" size={80} color={theme.colors.primary} />
      </View>

      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        LifeCall'a Hoş Geldiniz
      </Text>

      <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Uygulamanın tüm özelliklerini kullanabilmeniz için birkaç ayar yapmamız gerekiyor.
      </Text>

      <Card style={[styles.infoCard, { backgroundColor: theme.colors.primaryContainer }]}>
        <Card.Content>
          <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
            Bu kurulum sihirbazı şunları yapmanıza yardımcı olacak:
          </Text>
          <View style={styles.infoList}>
            <Text style={{ color: theme.colors.onPrimaryContainer }}>• Gerekli izinleri vermek</Text>
            <Text style={{ color: theme.colors.onPrimaryContainer }}>• Varsayılan telefon uygulaması olarak ayarlamak</Text>
            <Text style={{ color: theme.colors.onPrimaryContainer }}>• Cihazınıza özel ayarları yapmak</Text>
          </View>
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={nextStep} style={styles.primaryButton}>
        Kuruluma Başla
      </Button>

      <Button mode="text" onPress={handleSkip} style={styles.skipButton}>
        Şimdilik Atla
      </Button>
    </View>
  );

  // Render: İzinler adımı
  const renderPermissionsStep = () => (
    <View style={styles.stepContent}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Uygulama İzinleri
      </Text>

      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Aşağıdaki izinler uygulamanın düzgün çalışması için gereklidir.
      </Text>

      <ScrollView style={styles.permissionList}>
        {permissions.map((permission) => (
          <Card
            key={permission.id}
            style={[
              styles.permissionCard,
              {
                backgroundColor: permission.granted
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Card.Content style={styles.permissionCardContent}>
              <View style={styles.permissionInfo}>
                <MaterialCommunityIcons
                  name={permission.icon as any}
                  size={28}
                  color={permission.granted ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <View style={styles.permissionText}>
                  <Text
                    variant="titleSmall"
                    style={{
                      color: permission.granted ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                    }}
                  >
                    {permission.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: permission.granted ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                    }}
                  >
                    {permission.description}
                  </Text>
                </View>
              </View>

              {permission.granted ? (
                <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
              ) : (
                <Button
                  mode="contained-tonal"
                  compact
                  onPress={() => requestPermission(permission)}
                  loading={isLoading}
                >
                  İzin Ver
                </Button>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {!allPermissionsGranted && (
        <Button
          mode="contained"
          onPress={requestAllPermissions}
          style={styles.primaryButton}
          loading={isLoading}
        >
          Tüm İzinleri Ver
        </Button>
      )}

      <Button
        mode={allPermissionsGranted ? 'contained' : 'outlined'}
        onPress={nextStep}
        style={styles.primaryButton}
        disabled={!allPermissionsGranted && permissions.some((p) => p.required && !p.granted)}
      >
        {allPermissionsGranted ? 'Devam Et' : 'Atla'}
      </Button>
    </View>
  );

  // Render: Varsayılan uygulama adımı
  const renderDefaultAppStep = () => (
    <View style={styles.stepContent}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Varsayılan Telefon Uygulaması
      </Text>

      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Gelen aramaları doğrudan LifeCall ile cevaplayabilmeniz için varsayılan telefon uygulaması olarak
        ayarlamanız gerekiyor.
      </Text>

      <Card
        style={[
          styles.defaultAppCard,
          {
            backgroundColor: isDefaultDialer ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
          },
        ]}
      >
        <Card.Content style={styles.defaultAppContent}>
          <MaterialCommunityIcons
            name={isDefaultDialer ? 'check-circle' : 'phone-alert'}
            size={48}
            color={isDefaultDialer ? theme.colors.primary : theme.colors.error}
          />
          <Text
            variant="titleMedium"
            style={{
              color: isDefaultDialer ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
              marginTop: 12,
            }}
          >
            {isDefaultDialer ? 'LifeCall varsayılan telefon uygulaması' : 'Varsayılan olarak ayarlanmadı'}
          </Text>
          {!isDefaultDialer && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}
            >
              Varsayılan olarak ayarlanmazsa gelen aramalar sistem uygulamasında açılacaktır.
            </Text>
          )}
        </Card.Content>
      </Card>

      {!isDefaultDialer && (
        <Button
          mode="contained"
          onPress={requestDefaultDialer}
          style={styles.primaryButton}
          loading={isLoading}
          icon="phone-check"
        >
          Varsayılan Olarak Ayarla
        </Button>
      )}

      <Button mode={isDefaultDialer ? 'contained' : 'outlined'} onPress={nextStep} style={styles.primaryButton}>
        {isDefaultDialer ? 'Devam Et' : 'Şimdilik Atla'}
      </Button>
    </View>
  );

  // Render: Marka özel ayarlar adımı
  const renderBrandStep = () => (
    <View style={styles.stepContent}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Cihaz Ayarları
      </Text>

      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        {selectedBrand?.name} cihazlarda arka planda çalışabilmek için ek ayarlar gerekebilir.
      </Text>

      {/* Marka seçimi */}
      <View style={styles.brandSelector}>
        <Chip
          selected={true}
          onPress={() => setShowBrandModal(true)}
          icon="cellphone"
          style={styles.brandChip}
        >
          {selectedBrand?.name || 'Marka Seç'}
        </Chip>
        <Button mode="text" onPress={() => setShowBrandModal(true)}>
          Değiştir
        </Button>
      </View>

      {/* Talimatlar */}
      {selectedBrand && selectedBrand.instructions && (
        <Card style={[styles.instructionsCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Card.Content>
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
              Yapılması Gerekenler:
            </Text>
            {selectedBrand.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={[styles.instructionNumber, { color: theme.colors.primary }]}>
                  {index + 1}.
                </Text>
                <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
                  {instruction}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <Button mode="outlined" onPress={openSettings} style={styles.primaryButton} icon="cog">
        Ayarları Aç
      </Button>

      <Button mode="contained" onPress={nextStep} style={styles.primaryButton}>
        Devam Et
      </Button>

      {/* Marka seçim modalı */}
      <Portal>
        <Modal
          visible={showBrandModal}
          onDismiss={() => setShowBrandModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            Cihaz Markanızı Seçin
          </Text>
          <ScrollView style={styles.brandList}>
            {DEVICE_BRANDS.map((brand) => (
              <List.Item
                key={brand.id}
                title={brand.name}
                left={(props) => <List.Icon {...props} icon="cellphone" />}
                right={(props) =>
                  selectedBrand?.id === brand.id ? (
                    <List.Icon {...props} icon="check" color={theme.colors.primary} />
                  ) : null
                }
                onPress={() => {
                  setSelectedBrand(brand);
                  setShowBrandModal(false);
                }}
                style={[
                  styles.brandItem,
                  selectedBrand?.id === brand.id && { backgroundColor: theme.colors.primaryContainer },
                ]}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );

  // Render: Overlay izni adımı
  const renderOverlayStep = () => (
    <View style={styles.stepContent}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        Ekran Üstü Gösterim İzni
      </Text>

      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Başka uygulamalar açıkken gelen aramaları gösterebilmemiz için bu izin gereklidir.
      </Text>

      <Card
        style={[
          styles.defaultAppCard,
          {
            backgroundColor: hasOverlayPermission ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
          },
        ]}
      >
        <Card.Content style={styles.defaultAppContent}>
          <MaterialCommunityIcons
            name={hasOverlayPermission ? 'check-circle' : 'application-brackets-outline'}
            size={48}
            color={hasOverlayPermission ? theme.colors.primary : theme.colors.warning}
          />
          <Text
            variant="titleMedium"
            style={{
              color: hasOverlayPermission ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
              marginTop: 12,
            }}
          >
            {hasOverlayPermission ? 'Overlay izni verildi' : 'Overlay izni gerekli'}
          </Text>
          {!hasOverlayPermission && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}
            >
              Bu izin olmadan gelen arama popup'ı gösterilmeyebilir.
            </Text>
          )}
        </Card.Content>
      </Card>

      {!hasOverlayPermission && (
        <Button
          mode="contained"
          onPress={requestOverlayPermission}
          style={styles.primaryButton}
          loading={isLoading}
          icon="application-outline"
        >
          İzin Ver
        </Button>
      )}

      <Button
        mode={hasOverlayPermission ? 'contained' : 'outlined'}
        onPress={nextStep}
        style={styles.primaryButton}
      >
        {hasOverlayPermission ? 'Devam Et' : 'Şimdilik Atla'}
      </Button>
    </View>
  );

  // Render: Tamamlandı adımı
  const renderCompleteStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.completeIcon}>
        <MaterialCommunityIcons name="check-circle" size={100} color={theme.colors.primary} />
      </View>

      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        Kurulum Tamamlandı!
      </Text>

      <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        LifeCall kullanıma hazır. Artık aramalarınızı profesyonelce yönetebilirsiniz.
      </Text>

      {/* Durum özeti */}
      <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons
              name={allPermissionsGranted ? 'check-circle' : 'alert-circle'}
              size={24}
              color={allPermissionsGranted ? theme.colors.primary : theme.colors.warning}
            />
            <Text style={{ color: theme.colors.onSurfaceVariant, marginLeft: 12 }}>
              Uygulama izinleri: {allPermissionsGranted ? 'Tamamlandı' : 'Eksik'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons
              name={isDefaultDialer ? 'check-circle' : 'alert-circle'}
              size={24}
              color={isDefaultDialer ? theme.colors.primary : theme.colors.warning}
            />
            <Text style={{ color: theme.colors.onSurfaceVariant, marginLeft: 12 }}>
              Varsayılan uygulama: {isDefaultDialer ? 'Ayarlandı' : 'Ayarlanmadı'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons
              name={hasOverlayPermission ? 'check-circle' : 'alert-circle'}
              size={24}
              color={hasOverlayPermission ? theme.colors.primary : theme.colors.warning}
            />
            <Text style={{ color: theme.colors.onSurfaceVariant, marginLeft: 12 }}>
              Overlay izni: {hasOverlayPermission ? 'Verildi' : 'Verilmedi'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={handleComplete} style={styles.primaryButton} icon="check">
        Uygulamayı Başlat
      </Button>
    </View>
  );

  // Mevcut adımı render et
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'permissions':
        return renderPermissionsStep();
      case 'defaultApp':
        return renderDefaultAppStep();
      case 'brand':
        return renderBrandStep();
      case 'overlay':
        return renderOverlayStep();
      case 'complete':
        return renderCompleteStep();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* İlerleme çubuğu */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Adım {['welcome', 'permissions', 'defaultApp', 'brand', 'overlay', 'complete'].indexOf(currentStep) + 1} / 6
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>{renderCurrentStep()}</ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    padding: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
  },
  welcomeIcon: {
    marginVertical: 32,
  },
  completeIcon: {
    marginVertical: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  infoCard: {
    width: '100%',
    marginBottom: 24,
  },
  infoList: {
    marginTop: 12,
    gap: 4,
  },
  primaryButton: {
    width: '100%',
    marginTop: 12,
  },
  skipButton: {
    marginTop: 8,
  },
  permissionList: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 16,
  },
  permissionCard: {
    marginBottom: 8,
  },
  permissionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionText: {
    marginLeft: 12,
    flex: 1,
  },
  defaultAppCard: {
    width: '100%',
    marginBottom: 24,
  },
  defaultAppContent: {
    alignItems: 'center',
    padding: 24,
  },
  brandSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandChip: {
    marginRight: 8,
  },
  instructionsCard: {
    width: '100%',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  instructionNumber: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
  },
  instructionText: {
    flex: 1,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  brandList: {
    maxHeight: 400,
  },
  brandItem: {
    borderRadius: 8,
    marginBottom: 4,
  },
  summaryCard: {
    width: '100%',
    marginBottom: 24,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
});

export default SetupWizardScreen;
