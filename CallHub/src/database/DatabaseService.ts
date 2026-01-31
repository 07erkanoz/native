/**
 * LifeCall - SQLite Veritabanı Servisi
 *
 * react-native-sqlite-storage kullanarak yerel veritabanı yönetimi
 */

import SQLite, {
  SQLiteDatabase,
  Transaction,
  ResultSet,
} from 'react-native-sqlite-storage';
import {
  DATABASE_NAME,
  DATABASE_VERSION,
  CREATE_TABLES_SQL,
  INSERT_DEFAULT_THEMES_SQL,
} from './schema';

// SQLite ayarları
SQLite.enablePromise(true);
SQLite.DEBUG(__DEV__);

// Singleton instance
let dbInstance: SQLiteDatabase | null = null;

/**
 * Veritabanı bağlantısını al
 */
export const getDatabase = async (): Promise<SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
    });

    console.log('Veritabanı bağlantısı açıldı');
    return dbInstance;
  } catch (error) {
    console.error('Veritabanı açılamadı:', error);
    throw error;
  }
};

/**
 * Veritabanını başlat - tabloları oluştur
 */
export const initDatabase = async (): Promise<void> => {
  try {
    const db = await getDatabase();

    // SQL ifadelerini ayır ve çalıştır
    const statements = CREATE_TABLES_SQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await db.executeSql(statement);
      } catch (error) {
        // Bazı hatalar görmezden gelinebilir (IF EXISTS kontrolleri)
        if (!String(error).includes('already exists')) {
          console.warn('SQL hatası:', statement.substring(0, 50), error);
        }
      }
    }

    // Varsayılan temaları ekle
    const themeStatements = INSERT_DEFAULT_THEMES_SQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of themeStatements) {
      try {
        await db.executeSql(statement);
      } catch (error) {
        // Zaten varsa görmezden gel
      }
    }

    console.log('Veritabanı başlatıldı - Versiyon:', DATABASE_VERSION);
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
    throw error;
  }
};

/**
 * Veritabanını kapat
 */
export const closeDatabase = async (): Promise<void> => {
  if (dbInstance) {
    try {
      await dbInstance.close();
      dbInstance = null;
      console.log('Veritabanı bağlantısı kapatıldı');
    } catch (error) {
      console.error('Veritabanı kapatma hatası:', error);
    }
  }
};

/**
 * SQL sorgusu çalıştır (SELECT)
 */
export const executeQuery = async <T>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  try {
    const db = await getDatabase();
    const [result] = await db.executeSql(sql, params);

    const rows: T[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      rows.push(result.rows.item(i));
    }

    return rows;
  } catch (error) {
    console.error('SQL sorgu hatası:', sql, error);
    throw error;
  }
};

/**
 * SQL komutu çalıştır (INSERT, UPDATE, DELETE)
 */
export const executeCommand = async (
  sql: string,
  params: any[] = []
): Promise<ResultSet> => {
  try {
    const db = await getDatabase();
    const [result] = await db.executeSql(sql, params);
    return result;
  } catch (error) {
    console.error('SQL komut hatası:', sql, error);
    throw error;
  }
};

/**
 * Transaction içinde çoklu komut çalıştır
 */
export const executeTransaction = async (
  commands: { sql: string; params?: any[] }[]
): Promise<void> => {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: Transaction) => {
        commands.forEach(({ sql, params = [] }) => {
          tx.executeSql(sql, params);
        });
      },
      (error) => {
        console.error('Transaction hatası:', error);
        reject(error);
      },
      () => {
        resolve();
      }
    );
  });
};

/**
 * Tek kayıt getir
 */
export const getOne = async <T>(
  sql: string,
  params: any[] = []
): Promise<T | null> => {
  const results = await executeQuery<T>(sql, params);
  return results.length > 0 ? results[0] : null;
};

/**
 * Kayıt sayısını al
 */
export const getCount = async (
  table: string,
  whereClause?: string,
  params?: any[]
): Promise<number> => {
  let sql = `SELECT COUNT(*) as count FROM ${table}`;
  if (whereClause) {
    sql += ` WHERE ${whereClause}`;
  }

  const result = await getOne<{ count: number }>(sql, params);
  return result?.count || 0;
};

/**
 * Kayıt ekle
 */
export const insert = async (
  table: string,
  data: Record<string, any>
): Promise<string> => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');

  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

  await executeCommand(sql, values);
  return data.id || '';
};

/**
 * Kayıt güncelle
 */
export const update = async (
  table: string,
  data: Record<string, any>,
  whereClause: string,
  whereParams: any[] = []
): Promise<number> => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key) => `${key} = ?`).join(', ');

  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

  const result = await executeCommand(sql, [...values, ...whereParams]);
  return result.rowsAffected;
};

/**
 * Kayıt sil
 */
export const remove = async (
  table: string,
  whereClause: string,
  params: any[] = []
): Promise<number> => {
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  const result = await executeCommand(sql, params);
  return result.rowsAffected;
};

/**
 * Tablo temizle
 */
export const clearTable = async (table: string): Promise<void> => {
  await executeCommand(`DELETE FROM ${table}`);
};

/**
 * Veritabanı versiyonunu al
 */
export const getDatabaseVersion = async (): Promise<number> => {
  try {
    const result = await getOne<{ version: number }>(
      'SELECT version FROM db_version ORDER BY version DESC LIMIT 1'
    );
    return result?.version || 0;
  } catch {
    return 0;
  }
};

/**
 * UUID oluştur
 */
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default {
  getDatabase,
  initDatabase,
  closeDatabase,
  executeQuery,
  executeCommand,
  executeTransaction,
  getOne,
  getCount,
  insert,
  update,
  remove,
  clearTable,
  getDatabaseVersion,
  generateId,
};
