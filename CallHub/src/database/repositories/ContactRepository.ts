/**
 * LifeCall - Kişi Repository
 *
 * Yerel SQLite'daki kişi verilerini yönetir
 */

import {
  executeQuery,
  executeCommand,
  executeTransaction,
  getOne,
  getCount,
  insert,
  update,
  remove,
  generateId,
} from '../DatabaseService';
import { Contact, PhoneNumber, EmailAddress } from '../../types';

// Veritabanı kayıt tipi
interface ContactRow {
  id: string;
  device_contact_id: string | null;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  company: string | null;
  job_title: string | null;
  photo_uri: string | null;
  photo_thumbnail: string | null;
  custom_ringtone_id: string | null;
  custom_ringtone_uri: string | null;
  is_favorite: number;
  favorite_order: number | null;
  is_blocked: number;
  notes: string | null;
  birthday: string | null;
  anniversary: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

interface PhoneNumberRow {
  id: string;
  contact_id: string;
  number: string;
  formatted_number: string | null;
  country_code: string | null;
  label: string;
  is_primary: number;
}

interface EmailAddressRow {
  id: string;
  contact_id: string;
  email: string;
  label: string;
  is_primary: number;
}

/**
 * Tüm kişileri getir
 */
export const getAllContacts = async (): Promise<Contact[]> => {
  const rows = await executeQuery<ContactRow>(
    `SELECT * FROM contacts ORDER BY display_name COLLATE NOCASE`
  );

  const contacts: Contact[] = [];

  for (const row of rows) {
    const contact = await rowToContact(row);
    contacts.push(contact);
  }

  return contacts;
};

/**
 * Favori kişileri getir
 */
export const getFavoriteContacts = async (): Promise<Contact[]> => {
  const rows = await executeQuery<ContactRow>(
    `SELECT * FROM contacts WHERE is_favorite = 1 ORDER BY favorite_order, display_name COLLATE NOCASE`
  );

  const contacts: Contact[] = [];

  for (const row of rows) {
    const contact = await rowToContact(row);
    contacts.push(contact);
  }

  return contacts;
};

/**
 * ID ile kişi getir
 */
export const getContactById = async (id: string): Promise<Contact | null> => {
  const row = await getOne<ContactRow>(
    `SELECT * FROM contacts WHERE id = ?`,
    [id]
  );

  if (!row) return null;

  return rowToContact(row);
};

/**
 * Cihaz ID'si ile kişi getir
 */
export const getContactByDeviceId = async (
  deviceContactId: string
): Promise<Contact | null> => {
  const row = await getOne<ContactRow>(
    `SELECT * FROM contacts WHERE device_contact_id = ?`,
    [deviceContactId]
  );

  if (!row) return null;

  return rowToContact(row);
};

/**
 * Kişi ara
 */
export const searchContacts = async (query: string): Promise<Contact[]> => {
  const searchPattern = `%${query}%`;

  const rows = await executeQuery<ContactRow>(
    `SELECT DISTINCT c.* FROM contacts c
     LEFT JOIN phone_numbers p ON c.id = p.contact_id
     WHERE c.display_name LIKE ?
        OR c.first_name LIKE ?
        OR c.last_name LIKE ?
        OR c.company LIKE ?
        OR p.number LIKE ?
     ORDER BY c.display_name COLLATE NOCASE
     LIMIT 50`,
    [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
  );

  const contacts: Contact[] = [];

  for (const row of rows) {
    const contact = await rowToContact(row);
    contacts.push(contact);
  }

  return contacts;
};

/**
 * Kişi ekle
 */
export const addContact = async (contact: Partial<Contact>): Promise<string> => {
  const id = contact.id || generateId();
  const now = new Date().toISOString();

  // Ana kişi kaydı
  await insert('contacts', {
    id,
    device_contact_id: contact.rawContactId || null,
    display_name: contact.displayName || 'İsimsiz',
    first_name: contact.givenName || null,
    last_name: contact.familyName || null,
    nickname: contact.nickname || null,
    company: contact.company || null,
    job_title: contact.jobTitle || null,
    photo_uri: contact.photoUri || null,
    is_favorite: contact.isFavorite ? 1 : 0,
    is_blocked: contact.isBlocked ? 1 : 0,
    notes: contact.note || null,
    birthday: contact.birthday || null,
    created_at: now,
    updated_at: now,
  });

  // Telefon numaraları
  if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
    for (const phone of contact.phoneNumbers) {
      await insert('phone_numbers', {
        id: phone.id || generateId(),
        contact_id: id,
        number: phone.number,
        formatted_number: phone.formattedNumber,
        label: phone.label,
        is_primary: phone.isPrimary ? 1 : 0,
      });
    }
  }

  // E-posta adresleri
  if (contact.emailAddresses && contact.emailAddresses.length > 0) {
    for (const email of contact.emailAddresses) {
      await insert('email_addresses', {
        id: email.id || generateId(),
        contact_id: id,
        email: email.email,
        label: email.label,
        is_primary: email.isPrimary ? 1 : 0,
      });
    }
  }

  return id;
};

/**
 * Kişi güncelle
 */
export const updateContact = async (contact: Contact): Promise<void> => {
  const now = new Date().toISOString();

  await update(
    'contacts',
    {
      display_name: contact.displayName,
      first_name: contact.givenName || null,
      last_name: contact.familyName || null,
      nickname: contact.nickname || null,
      company: contact.company || null,
      job_title: contact.jobTitle || null,
      photo_uri: contact.photoUri || null,
      is_favorite: contact.isFavorite ? 1 : 0,
      is_blocked: contact.isBlocked ? 1 : 0,
      notes: contact.note || null,
      birthday: contact.birthday || null,
      updated_at: now,
    },
    'id = ?',
    [contact.id]
  );

  // Telefon numaralarını güncelle (önce sil, sonra ekle)
  await remove('phone_numbers', 'contact_id = ?', [contact.id]);
  for (const phone of contact.phoneNumbers) {
    await insert('phone_numbers', {
      id: phone.id || generateId(),
      contact_id: contact.id,
      number: phone.number,
      formatted_number: phone.formattedNumber,
      label: phone.label,
      is_primary: phone.isPrimary ? 1 : 0,
    });
  }

  // E-posta adreslerini güncelle
  await remove('email_addresses', 'contact_id = ?', [contact.id]);
  for (const email of contact.emailAddresses) {
    await insert('email_addresses', {
      id: email.id || generateId(),
      contact_id: contact.id,
      email: email.email,
      label: email.label,
      is_primary: email.isPrimary ? 1 : 0,
    });
  }
};

/**
 * Kişi sil
 */
export const deleteContact = async (id: string): Promise<void> => {
  await remove('contacts', 'id = ?', [id]);
};

/**
 * Favori durumunu değiştir
 */
export const toggleFavorite = async (
  id: string,
  isFavorite: boolean
): Promise<void> => {
  const now = new Date().toISOString();

  let favoriteOrder = null;
  if (isFavorite) {
    // En son sıraya ekle
    const maxOrder = await getOne<{ max_order: number }>(
      `SELECT MAX(favorite_order) as max_order FROM contacts WHERE is_favorite = 1`
    );
    favoriteOrder = (maxOrder?.max_order || 0) + 1;
  }

  await update(
    'contacts',
    {
      is_favorite: isFavorite ? 1 : 0,
      favorite_order: favoriteOrder,
      updated_at: now,
    },
    'id = ?',
    [id]
  );
};

/**
 * Engelleme durumunu değiştir
 */
export const toggleBlocked = async (
  id: string,
  isBlocked: boolean
): Promise<void> => {
  const now = new Date().toISOString();

  await update(
    'contacts',
    {
      is_blocked: isBlocked ? 1 : 0,
      updated_at: now,
    },
    'id = ?',
    [id]
  );
};

/**
 * Kişi sayısını al
 */
export const getContactsCount = async (): Promise<number> => {
  return getCount('contacts');
};

/**
 * Veritabanı satırını Contact nesnesine dönüştür
 */
const rowToContact = async (row: ContactRow): Promise<Contact> => {
  // Telefon numaralarını al
  const phoneRows = await executeQuery<PhoneNumberRow>(
    `SELECT * FROM phone_numbers WHERE contact_id = ? ORDER BY is_primary DESC`,
    [row.id]
  );

  const phoneNumbers: PhoneNumber[] = phoneRows.map((p) => ({
    id: p.id,
    number: p.number,
    formattedNumber: p.formatted_number || p.number,
    label: p.label as any,
    isPrimary: p.is_primary === 1,
  }));

  // E-posta adreslerini al
  const emailRows = await executeQuery<EmailAddressRow>(
    `SELECT * FROM email_addresses WHERE contact_id = ? ORDER BY is_primary DESC`,
    [row.id]
  );

  const emailAddresses: EmailAddress[] = emailRows.map((e) => ({
    id: e.id,
    email: e.email,
    label: e.label as any,
    isPrimary: e.is_primary === 1,
  }));

  return {
    id: row.id,
    rawContactId: row.device_contact_id || row.id,
    accountType: 'phone',
    accountName: '',

    displayName: row.display_name,
    givenName: row.first_name || undefined,
    familyName: row.last_name || undefined,
    nickname: row.nickname || undefined,

    thumbnailPath: row.photo_thumbnail || undefined,
    photoUri: row.photo_uri || undefined,
    hasPhoto: !!row.photo_uri,
    photoSource: row.photo_uri ? 'device' : 'avatar',

    phoneNumbers,
    emailAddresses,
    postalAddresses: [],

    company: row.company || undefined,
    jobTitle: row.job_title || undefined,

    birthday: row.birthday || undefined,
    anniversary: row.anniversary || undefined,
    importantDates: [],

    websites: [],
    socialProfiles: [],
    relations: [],
    groups: [],

    note: row.notes || undefined,
    customRingtone: row.custom_ringtone_uri || undefined,

    isFavorite: row.is_favorite === 1,
    isBlocked: row.is_blocked === 1,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export default {
  getAllContacts,
  getFavoriteContacts,
  getContactById,
  getContactByDeviceId,
  searchContacts,
  addContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  toggleBlocked,
  getContactsCount,
};
