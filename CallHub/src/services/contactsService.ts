/**
 * LifeCall - Kişi Servisi
 *
 * Cihazdan kişileri okuma, yazma ve yönetme
 * react-native-contacts kütüphanesi kullanır
 */

import Contacts, {
  Contact as RNContact,
  PhoneNumber as RNPhoneNumber,
  EmailAddress as RNEmailAddress,
  PostalAddress as RNPostalAddress,
} from 'react-native-contacts';
import { Platform } from 'react-native';
import { ensurePermission } from './permissions';
import {
  Contact,
  PhoneNumber,
  EmailAddress,
  PostalAddress,
  PhoneLabel,
  EmailLabel,
  AddressLabel,
  AccountType,
  DeviceAccount,
} from '../types';

/**
 * RN Contacts kişisini uygulama kişisine dönüştür
 */
const transformContact = (rnContact: RNContact): Contact => {
  // Telefon numaralarını dönüştür
  const phoneNumbers: PhoneNumber[] = (rnContact.phoneNumbers || []).map(
    (phone: RNPhoneNumber, index: number) => ({
      id: `phone_${index}`,
      number: phone.number,
      formattedNumber: phone.number, // TODO: Formatlama eklenecek
      label: mapPhoneLabel(phone.label),
      customLabel: phone.label === 'custom' ? phone.label : undefined,
      isPrimary: index === 0,
    })
  );

  // E-posta adreslerini dönüştür
  const emailAddresses: EmailAddress[] = (rnContact.emailAddresses || []).map(
    (email: RNEmailAddress, index: number) => ({
      id: `email_${index}`,
      email: email.email,
      label: mapEmailLabel(email.label),
      customLabel: email.label === 'custom' ? email.label : undefined,
      isPrimary: index === 0,
    })
  );

  // Adresleri dönüştür
  const postalAddresses: PostalAddress[] = (rnContact.postalAddresses || []).map(
    (addr: RNPostalAddress, index: number) => ({
      id: `addr_${index}`,
      street: addr.street,
      city: addr.city,
      state: addr.region,
      postalCode: addr.postCode,
      country: addr.country,
      formattedAddress: formatAddress(addr),
      label: mapAddressLabel(addr.label),
      customLabel: addr.label === 'custom' ? addr.label : undefined,
    })
  );

  // Hesap tipini belirle
  const accountType = detectAccountType(rnContact);

  return {
    id: rnContact.recordID,
    rawContactId: rnContact.recordID,
    accountType,
    accountName: '', // Platform'a göre alınacak

    // İsim bilgileri
    displayName:
      rnContact.displayName ||
      `${rnContact.givenName || ''} ${rnContact.familyName || ''}`.trim() ||
      'İsimsiz',
    givenName: rnContact.givenName,
    middleName: rnContact.middleName,
    familyName: rnContact.familyName,
    prefix: rnContact.prefix,
    suffix: rnContact.suffix,
    nickname: rnContact.nickname,

    // Fotoğraf
    thumbnailPath: rnContact.thumbnailPath,
    photoUri: rnContact.hasThumbnail ? rnContact.thumbnailPath : undefined,
    hasPhoto: rnContact.hasThumbnail,
    photoSource: rnContact.hasThumbnail ? 'device' : 'avatar',

    // İletişim
    phoneNumbers,
    emailAddresses,
    postalAddresses,

    // Kuruluş
    company: rnContact.company,
    department: rnContact.department,
    jobTitle: rnContact.jobTitle,

    // Tarihler
    birthday: rnContact.birthday
      ? `${rnContact.birthday.year}-${String(rnContact.birthday.month).padStart(2, '0')}-${String(rnContact.birthday.day).padStart(2, '0')}`
      : undefined,
    importantDates: [],

    // Web & Sosyal
    websites: [],
    socialProfiles: [],

    // İlişkiler
    relations: [],

    // Gruplar
    groups: [],

    // Notlar
    note: rnContact.note,

    // Durumlar
    isFavorite: rnContact.isStarred || false,
    isBlocked: false,

    // Meta
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Telefon etiketi dönüşümü
 */
const mapPhoneLabel = (label?: string): PhoneLabel => {
  const labelMap: Record<string, PhoneLabel> = {
    mobile: 'mobile',
    home: 'home',
    work: 'work',
    main: 'main',
    'work fax': 'fax_work',
    'home fax': 'fax_home',
    pager: 'pager',
    other: 'other',
  };

  return labelMap[label?.toLowerCase() || ''] || 'mobile';
};

/**
 * E-posta etiketi dönüşümü
 */
const mapEmailLabel = (label?: string): EmailLabel => {
  const labelMap: Record<string, EmailLabel> = {
    home: 'personal',
    work: 'work',
    other: 'other',
  };

  return labelMap[label?.toLowerCase() || ''] || 'personal';
};

/**
 * Adres etiketi dönüşümü
 */
const mapAddressLabel = (label?: string): AddressLabel => {
  const labelMap: Record<string, AddressLabel> = {
    home: 'home',
    work: 'work',
    other: 'other',
  };

  return labelMap[label?.toLowerCase() || ''] || 'home';
};

/**
 * Adres formatlama
 */
const formatAddress = (addr: RNPostalAddress): string => {
  const parts = [
    addr.street,
    addr.city,
    addr.region,
    addr.postCode,
    addr.country,
  ].filter(Boolean);

  return parts.join(', ');
};

/**
 * Hesap tipini tespit et
 */
const detectAccountType = (contact: RNContact): AccountType => {
  // Android'de rawContactId'den hesap bilgisi alınabilir
  // Şimdilik basit bir tespit
  return 'phone';
};

/**
 * Tüm kişileri getir
 */
export const getAllContacts = async (): Promise<Contact[]> => {
  // İzin kontrolü
  const hasPermission = await ensurePermission('contacts');
  if (!hasPermission) {
    throw new Error('Kişiler izni verilmedi');
  }

  return new Promise((resolve, reject) => {
    Contacts.getAll()
      .then((contacts) => {
        const transformedContacts = contacts.map(transformContact);
        // İsme göre sırala
        transformedContacts.sort((a, b) =>
          a.displayName.localeCompare(b.displayName, 'tr')
        );
        resolve(transformedContacts);
      })
      .catch((error) => {
        console.error('Kişiler alınamadı:', error);
        reject(error);
      });
  });
};

/**
 * Kişi ara
 */
export const searchContacts = async (query: string): Promise<Contact[]> => {
  const hasPermission = await ensurePermission('contacts');
  if (!hasPermission) {
    throw new Error('Kişiler izni verilmedi');
  }

  return new Promise((resolve, reject) => {
    Contacts.getContactsMatchingString(query)
      .then((contacts) => {
        const transformedContacts = contacts.map(transformContact);
        resolve(transformedContacts);
      })
      .catch((error) => {
        console.error('Kişi araması başarısız:', error);
        reject(error);
      });
  });
};

/**
 * Kişi detayını getir
 */
export const getContactById = async (
  contactId: string
): Promise<Contact | null> => {
  const hasPermission = await ensurePermission('contacts');
  if (!hasPermission) {
    throw new Error('Kişiler izni verilmedi');
  }

  return new Promise((resolve, reject) => {
    Contacts.getContactById(contactId)
      .then((contact) => {
        if (contact) {
          resolve(transformContact(contact));
        } else {
          resolve(null);
        }
      })
      .catch((error) => {
        console.error('Kişi bulunamadı:', error);
        reject(error);
      });
  });
};

/**
 * Telefon numarasından kişi bul
 */
export const getContactByPhoneNumber = async (
  phoneNumber: string
): Promise<Contact | null> => {
  const hasPermission = await ensurePermission('contacts');
  if (!hasPermission) {
    return null;
  }

  return new Promise((resolve) => {
    Contacts.getContactsByPhoneNumber(phoneNumber)
      .then((contacts) => {
        if (contacts && contacts.length > 0) {
          resolve(transformContact(contacts[0]));
        } else {
          resolve(null);
        }
      })
      .catch(() => {
        resolve(null);
      });
  });
};

/**
 * Yeni kişi ekle
 */
export const addContact = async (
  contact: Partial<Contact>
): Promise<Contact> => {
  const hasPermission = await ensurePermission('contacts');
  if (!hasPermission) {
    throw new Error('Kişiler izni verilmedi');
  }

  const rnContact: Partial<RNContact> = {
    givenName: contact.givenName || contact.displayName,
    familyName: contact.familyName,
    middleName: contact.middleName,
    prefix: contact.prefix,
    suffix: contact.suffix,
    nickname: contact.nickname,
    company: contact.company,
    department: contact.department,
    jobTitle: contact.jobTitle,
    note: contact.note,
    phoneNumbers: contact.phoneNumbers?.map((p) => ({
      label: p.label,
      number: p.number,
    })),
    emailAddresses: contact.emailAddresses?.map((e) => ({
      label: e.label,
      email: e.email,
    })),
    isStarred: contact.isFavorite,
  };

  return new Promise((resolve, reject) => {
    Contacts.addContact(rnContact as RNContact)
      .then((addedContact) => {
        resolve(transformContact(addedContact));
      })
      .catch((error) => {
        console.error('Kişi eklenemedi:', error);
        reject(error);
      });
  });
};

/**
 * Kişi güncelle
 */
export const updateContact = async (contact: Contact): Promise<Contact> => {
  const hasPermission = await ensurePermission('contacts');
  if (!hasPermission) {
    throw new Error('Kişiler izni verilmedi');
  }

  const rnContact: Partial<RNContact> = {
    recordID: contact.id,
    givenName: contact.givenName,
    familyName: contact.familyName,
    middleName: contact.middleName,
    prefix: contact.prefix,
    suffix: contact.suffix,
    nickname: contact.nickname,
    company: contact.company,
    department: contact.department,
    jobTitle: contact.jobTitle,
    note: contact.note,
    phoneNumbers: contact.phoneNumbers?.map((p) => ({
      label: p.label,
      number: p.number,
    })),
    emailAddresses: contact.emailAddresses?.map((e) => ({
      label: e.label,
      email: e.email,
    })),
    isStarred: contact.isFavorite,
  };

  return new Promise((resolve, reject) => {
    Contacts.updateContact(rnContact as RNContact)
      .then(() => {
        resolve(contact);
      })
      .catch((error) => {
        console.error('Kişi güncellenemedi:', error);
        reject(error);
      });
  });
};

/**
 * Kişi sil
 */
export const deleteContact = async (contactId: string): Promise<void> => {
  const hasPermission = await ensurePermission('contacts');
  if (!hasPermission) {
    throw new Error('Kişiler izni verilmedi');
  }

  return new Promise((resolve, reject) => {
    Contacts.deleteContact({ recordID: contactId } as RNContact)
      .then(() => {
        resolve();
      })
      .catch((error) => {
        console.error('Kişi silinemedi:', error);
        reject(error);
      });
  });
};

/**
 * Kişi sayısını al
 */
export const getContactsCount = async (): Promise<number> => {
  const hasPermission = await ensurePermission('contacts');
  if (!hasPermission) {
    return 0;
  }

  return new Promise((resolve) => {
    Contacts.getCount()
      .then((count) => {
        resolve(count);
      })
      .catch(() => {
        resolve(0);
      });
  });
};

/**
 * Cihaz hesaplarını al
 */
export const getDeviceAccounts = async (): Promise<DeviceAccount[]> => {
  // Android'de hesap bilgilerini almak için native modül gerekir
  // Şimdilik mock data döndür
  if (Platform.OS === 'android') {
    return [
      {
        id: 'phone',
        type: 'phone',
        name: 'phone',
        displayName: 'Telefon',
        icon: 'cellphone',
        contactCount: 0,
        isVisible: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
      {
        id: 'google',
        type: 'google',
        name: 'google',
        displayName: 'Google',
        icon: 'google',
        contactCount: 0,
        isVisible: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
    ];
  }

  // iOS
  return [
    {
      id: 'icloud',
      type: 'other',
      name: 'iCloud',
      displayName: 'iCloud',
      icon: 'cloud',
      contactCount: 0,
      isVisible: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
    },
  ];
};

export default {
  getAllContacts,
  searchContacts,
  getContactById,
  getContactByPhoneNumber,
  addContact,
  updateContact,
  deleteContact,
  getContactsCount,
  getDeviceAccounts,
};
