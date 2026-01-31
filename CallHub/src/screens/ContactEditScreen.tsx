/**
 * LifeCall - Kişi Düzenleme/Ekleme Ekranı
 *
 * Kişi bilgilerini düzenler veya yeni kişi ekler
 * - İsim bilgileri
 * - Telefon numaraları (çoklu)
 * - E-posta adresleri (çoklu)
 * - Şirket bilgileri
 * - Doğum günü / Yıldönümü
 * - Notlar
 * - Fotoğraf seçimi
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  Button,
  Divider,
  Menu,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

import { useAppTheme } from '../theme';
import { Avatar } from '../components';
import { Contact, PhoneNumber, EmailAddress, PhoneLabel, EmailLabel } from '../types';
import { RootStackScreenProps } from '../navigation/types';
import ContactRepository from '../database/repositories/ContactRepository';
import { generateId } from '../database/DatabaseService';

type Props = RootStackScreenProps<'ContactEdit'>;

// Boş telefon numarası
const createEmptyPhone = (): PhoneNumber => ({
  id: generateId(),
  number: '',
  formattedNumber: '',
  label: 'mobile',
  isPrimary: false,
});

// Boş e-posta
const createEmptyEmail = (): EmailAddress => ({
  id: generateId(),
  email: '',
  label: 'personal',
  isPrimary: false,
});

const ContactEditScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const navigation = useNavigation<Props['navigation']>();
  const contactId = route.params?.contactId;
  const isEditMode = !!contactId;

  // Form state
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  // İsim bilgileri
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');

  // İletişim bilgileri
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([createEmptyPhone()]);
  const [emailAddresses, setEmailAddresses] = useState<EmailAddress[]>([]);

  // Şirket bilgileri
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  // Tarihler
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');

  // Notlar
  const [note, setNote] = useState('');

  // Label menüleri
  const [phoneLabelMenuIndex, setPhoneLabelMenuIndex] = useState<number | null>(null);
  const [emailLabelMenuIndex, setEmailLabelMenuIndex] = useState<number | null>(null);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

  // Kişiyi yükle (düzenleme modu)
  useEffect(() => {
    if (isEditMode && contactId) {
      loadContact();
    }
  }, [contactId]);

  const loadContact = async () => {
    try {
      setIsLoading(true);
      const contact = await ContactRepository.getContactById(contactId!);
      if (contact) {
        setPhotoUri(contact.photoUri);
        setFirstName(contact.givenName || '');
        setLastName(contact.familyName || '');
        setNickname(contact.nickname || '');
        setPhoneNumbers(
          contact.phoneNumbers.length > 0 ? contact.phoneNumbers : [createEmptyPhone()]
        );
        setEmailAddresses(contact.emailAddresses);
        setCompany(contact.company || '');
        setJobTitle(contact.jobTitle || '');
        setBirthday(contact.birthday || '');
        setAnniversary(contact.anniversary || '');
        setNote(contact.note || '');
      }
    } catch (error) {
      console.error('Kişi yüklenemedi:', error);
      Alert.alert(t('common.error'), t('contacts.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Display name oluştur
  const getDisplayName = useCallback(() => {
    const parts = [firstName, lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : nickname || t('contacts.unnamed');
  }, [firstName, lastName, nickname, t]);

  // Telefon numarası ekle
  const handleAddPhone = useCallback(() => {
    setPhoneNumbers([...phoneNumbers, createEmptyPhone()]);
  }, [phoneNumbers]);

  // Telefon numarası kaldır
  const handleRemovePhone = useCallback(
    (index: number) => {
      if (phoneNumbers.length > 1) {
        const updated = [...phoneNumbers];
        updated.splice(index, 1);
        setPhoneNumbers(updated);
      } else {
        // Son numarayı temizle
        setPhoneNumbers([createEmptyPhone()]);
      }
    },
    [phoneNumbers]
  );

  // Telefon numarası güncelle
  const handleUpdatePhone = useCallback(
    (index: number, field: keyof PhoneNumber, value: string) => {
      const updated = [...phoneNumbers];
      updated[index] = { ...updated[index], [field]: value };
      setPhoneNumbers(updated);
    },
    [phoneNumbers]
  );

  // Telefon label güncelle
  const handleUpdatePhoneLabel = useCallback(
    (index: number, label: PhoneLabel) => {
      const updated = [...phoneNumbers];
      updated[index] = { ...updated[index], label };
      setPhoneNumbers(updated);
      setPhoneLabelMenuIndex(null);
    },
    [phoneNumbers]
  );

  // E-posta ekle
  const handleAddEmail = useCallback(() => {
    setEmailAddresses([...emailAddresses, createEmptyEmail()]);
  }, [emailAddresses]);

  // E-posta kaldır
  const handleRemoveEmail = useCallback(
    (index: number) => {
      const updated = [...emailAddresses];
      updated.splice(index, 1);
      setEmailAddresses(updated);
    },
    [emailAddresses]
  );

  // E-posta güncelle
  const handleUpdateEmail = useCallback(
    (index: number, field: keyof EmailAddress, value: string) => {
      const updated = [...emailAddresses];
      updated[index] = { ...updated[index], [field]: value };
      setEmailAddresses(updated);
    },
    [emailAddresses]
  );

  // E-posta label güncelle
  const handleUpdateEmailLabel = useCallback(
    (index: number, label: EmailLabel) => {
      const updated = [...emailAddresses];
      updated[index] = { ...updated[index], label };
      setEmailAddresses(updated);
      setEmailLabelMenuIndex(null);
    },
    [emailAddresses]
  );

  // Fotoğraf seç
  const handleSelectPhoto = useCallback(async (source: 'camera' | 'gallery') => {
    setPhotoMenuVisible(false);

    try {
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      };

      const result =
        source === 'camera'
          ? await launchCamera(options)
          : await launchImageLibrary(options);

      if (result.assets && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Fotoğraf seçilemedi:', error);
    }
  }, []);

  // Fotoğrafı kaldır
  const handleRemovePhoto = useCallback(() => {
    setPhotoUri(undefined);
    setPhotoMenuVisible(false);
  }, []);

  // Kaydet
  const handleSave = useCallback(async () => {
    // Validasyon
    const displayName = getDisplayName();
    if (displayName === t('contacts.unnamed')) {
      Alert.alert(t('common.error'), t('contacts.nameRequired'));
      return;
    }

    // En az bir telefon numarası gerekli
    const validPhones = phoneNumbers.filter((p) => p.number.trim());
    if (validPhones.length === 0) {
      Alert.alert(t('common.error'), t('contacts.phoneRequired'));
      return;
    }

    // İlk numarayı primary yap
    if (validPhones.length > 0 && !validPhones.some((p) => p.isPrimary)) {
      validPhones[0].isPrimary = true;
    }

    // Geçerli e-postaları filtrele
    const validEmails = emailAddresses.filter((e) => e.email.trim());

    try {
      setIsSaving(true);

      const contactData: Partial<Contact> = {
        displayName,
        givenName: firstName || undefined,
        familyName: lastName || undefined,
        nickname: nickname || undefined,
        phoneNumbers: validPhones,
        emailAddresses: validEmails,
        company: company || undefined,
        jobTitle: jobTitle || undefined,
        birthday: birthday || undefined,
        anniversary: anniversary || undefined,
        note: note || undefined,
        photoUri,
        hasPhoto: !!photoUri,
        photoSource: photoUri ? 'custom' : 'avatar',
      };

      if (isEditMode && contactId) {
        // Güncelle
        const existingContact = await ContactRepository.getContactById(contactId);
        if (existingContact) {
          await ContactRepository.updateContact({
            ...existingContact,
            ...contactData,
          } as Contact);
        }
      } else {
        // Yeni ekle
        await ContactRepository.addContact(contactData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      Alert.alert(t('common.error'), t('contacts.saveError'));
    } finally {
      setIsSaving(false);
    }
  }, [
    firstName,
    lastName,
    nickname,
    phoneNumbers,
    emailAddresses,
    company,
    jobTitle,
    birthday,
    anniversary,
    note,
    photoUri,
    isEditMode,
    contactId,
    getDisplayName,
    t,
    navigation,
  ]);

  // Telefon label çevirisi
  const getPhoneLabelText = useCallback(
    (label: PhoneLabel) => {
      const labels: Record<PhoneLabel, string> = {
        mobile: t('contacts.phoneLabels.mobile'),
        home: t('contacts.phoneLabels.home'),
        work: t('contacts.phoneLabels.work'),
        main: t('contacts.phoneLabels.main'),
        fax_work: t('contacts.phoneLabels.faxWork'),
        fax_home: t('contacts.phoneLabels.faxHome'),
        pager: t('contacts.phoneLabels.pager'),
        other: t('contacts.phoneLabels.other'),
        custom: t('contacts.phoneLabels.custom'),
      };
      return labels[label] || label;
    },
    [t]
  );

  // E-posta label çevirisi
  const getEmailLabelText = useCallback(
    (label: EmailLabel) => {
      const labels: Record<EmailLabel, string> = {
        personal: t('contacts.emailLabels.personal'),
        work: t('contacts.emailLabels.work'),
        other: t('contacts.emailLabels.other'),
        custom: t('contacts.emailLabels.custom'),
      };
      return labels[label] || label;
    },
    [t]
  );

  // Yükleniyor
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="close" onPress={() => navigation.goBack()} />
        <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
          {isEditMode ? t('contacts.editContact') : t('contacts.newContact')}
        </Text>
        <Button
          mode="text"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
        >
          {t('common.save')}
        </Button>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Fotoğraf */}
          <View style={styles.photoSection}>
            <Menu
              visible={photoMenuVisible}
              onDismiss={() => setPhotoMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.photoContainer}
                  onPress={() => setPhotoMenuVisible(true)}
                >
                  <Avatar name={getDisplayName()} photoUri={photoUri} size={100} />
                  <View
                    style={[
                      styles.photoOverlay,
                      { backgroundColor: 'rgba(0,0,0,0.5)' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="camera"
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                </TouchableOpacity>
              }
            >
              <Menu.Item
                leadingIcon="camera"
                onPress={() => handleSelectPhoto('camera')}
                title={t('contacts.takePhoto')}
              />
              <Menu.Item
                leadingIcon="image"
                onPress={() => handleSelectPhoto('gallery')}
                title={t('contacts.choosePhoto')}
              />
              {photoUri && (
                <>
                  <Divider />
                  <Menu.Item
                    leadingIcon="delete"
                    onPress={handleRemovePhoto}
                    title={t('contacts.removePhoto')}
                    titleStyle={{ color: theme.colors.error }}
                  />
                </>
              )}
            </Menu>
          </View>

          {/* İsim Bilgileri */}
          <View style={styles.section}>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              {t('contacts.nameInfo')}
            </Text>

            <TextInput
              label={t('contacts.firstName')}
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label={t('contacts.lastName')}
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label={t('contacts.nickname')}
              value={nickname}
              onChangeText={setNickname}
              mode="outlined"
              style={styles.input}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Telefon Numaraları */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                variant="titleSmall"
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                {t('contacts.phoneNumbers')}
              </Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={handleAddPhone}
              />
            </View>

            {phoneNumbers.map((phone, index) => (
              <View key={phone.id} style={styles.fieldRow}>
                <Menu
                  visible={phoneLabelMenuIndex === index}
                  onDismiss={() => setPhoneLabelMenuIndex(null)}
                  anchor={
                    <TouchableOpacity
                      style={[styles.labelButton, { borderColor: theme.colors.outline }]}
                      onPress={() => setPhoneLabelMenuIndex(index)}
                    >
                      <Text variant="labelMedium">
                        {getPhoneLabelText(phone.label)}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={16}
                        color={theme.colors.onSurface}
                      />
                    </TouchableOpacity>
                  }
                >
                  {(['mobile', 'home', 'work', 'main', 'other'] as PhoneLabel[]).map(
                    (label) => (
                      <Menu.Item
                        key={label}
                        onPress={() => handleUpdatePhoneLabel(index, label)}
                        title={getPhoneLabelText(label)}
                      />
                    )
                  )}
                </Menu>

                <TextInput
                  value={phone.number}
                  onChangeText={(text) => handleUpdatePhone(index, 'number', text)}
                  placeholder={t('contacts.phoneNumber')}
                  keyboardType="phone-pad"
                  mode="outlined"
                  style={styles.fieldInput}
                  dense
                />

                <IconButton
                  icon="minus-circle-outline"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={() => handleRemovePhone(index)}
                />
              </View>
            ))}
          </View>

          <Divider style={styles.divider} />

          {/* E-posta Adresleri */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                variant="titleSmall"
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                {t('contacts.emailAddresses')}
              </Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={handleAddEmail}
              />
            </View>

            {emailAddresses.map((email, index) => (
              <View key={email.id} style={styles.fieldRow}>
                <Menu
                  visible={emailLabelMenuIndex === index}
                  onDismiss={() => setEmailLabelMenuIndex(null)}
                  anchor={
                    <TouchableOpacity
                      style={[styles.labelButton, { borderColor: theme.colors.outline }]}
                      onPress={() => setEmailLabelMenuIndex(index)}
                    >
                      <Text variant="labelMedium">
                        {getEmailLabelText(email.label)}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={16}
                        color={theme.colors.onSurface}
                      />
                    </TouchableOpacity>
                  }
                >
                  {(['personal', 'work', 'other'] as EmailLabel[]).map((label) => (
                    <Menu.Item
                      key={label}
                      onPress={() => handleUpdateEmailLabel(index, label)}
                      title={getEmailLabelText(label)}
                    />
                  ))}
                </Menu>

                <TextInput
                  value={email.email}
                  onChangeText={(text) => handleUpdateEmail(index, 'email', text)}
                  placeholder={t('contacts.emailAddress')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  mode="outlined"
                  style={styles.fieldInput}
                  dense
                />

                <IconButton
                  icon="minus-circle-outline"
                  size={20}
                  iconColor={theme.colors.error}
                  onPress={() => handleRemoveEmail(index)}
                />
              </View>
            ))}

            {emailAddresses.length === 0 && (
              <TouchableOpacity
                style={[styles.addButton, { borderColor: theme.colors.outline }]}
                onPress={handleAddEmail}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.primary, marginLeft: 8 }}
                >
                  {t('contacts.addEmail')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Şirket Bilgileri */}
          <View style={styles.section}>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              {t('contacts.companyInfo')}
            </Text>

            <TextInput
              label={t('contacts.company')}
              value={company}
              onChangeText={setCompany}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="domain" />}
            />

            <TextInput
              label={t('contacts.jobTitle')}
              value={jobTitle}
              onChangeText={setJobTitle}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="briefcase" />}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Tarihler */}
          <View style={styles.section}>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              {t('contacts.dates')}
            </Text>

            <TextInput
              label={t('contacts.birthday')}
              value={birthday}
              onChangeText={setBirthday}
              placeholder="GG/AA/YYYY"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="cake-variant" />}
            />

            <TextInput
              label={t('contacts.anniversary')}
              value={anniversary}
              onChangeText={setAnniversary}
              placeholder="GG/AA/YYYY"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="heart" />}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Notlar */}
          <View style={styles.section}>
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              {t('contacts.notes')}
            </Text>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('contacts.addNote')}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.noteInput]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  content: {
    paddingBottom: 32,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  photoContainer: {
    position: 'relative',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  noteInput: {
    minHeight: 100,
  },
  divider: {
    marginVertical: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 90,
    justifyContent: 'space-between',
  },
  fieldInput: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
});

export default ContactEditScreen;
