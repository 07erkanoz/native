/**
 * LifeCall - Backup Service
 *
 * Uygulama verilerini yerel olarak yedekler ve geri yükler.
 * - Ayarlar
 * - Notlar
 * - Takvim etkinlikleri
 * - Engelleme listesi
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Platform } from 'react-native';

// Backup file constants
const BACKUP_FOLDER = 'LifeCallBackups';
const BACKUP_FILE_EXTENSION = '.lifecall';
const BACKUP_VERSION = '1.0';

// Storage keys
const STORAGE_KEYS = {
  settings: 'persist:settings',
  notes: 'persist:notes',
  calendar: 'persist:calendar',
  blocking: 'persist:blocking',
  favorites: 'persist:favorites',
};

// Backup data interface
export interface BackupData {
  version: string;
  createdAt: string;
  deviceInfo: {
    platform: string;
    appVersion: string;
  };
  data: {
    settings?: any;
    notes?: any;
    calendar?: any;
    blocking?: any;
    favorites?: any;
  };
}

// Backup result interface
export interface BackupResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  size?: number;
  error?: string;
}

// Restore result interface
export interface RestoreResult {
  success: boolean;
  restoredItems: string[];
  error?: string;
}

// Backup list item interface
export interface BackupListItem {
  fileName: string;
  filePath: string;
  createdAt: Date;
  size: number;
}

class BackupService {
  private backupDir: string;

  constructor() {
    this.backupDir = `${RNFS.DocumentDirectoryPath}/${BACKUP_FOLDER}`;
  }

  /**
   * Yedekleme klasörünü oluştur
   */
  private async ensureBackupDir(): Promise<void> {
    const exists = await RNFS.exists(this.backupDir);
    if (!exists) {
      await RNFS.mkdir(this.backupDir);
    }
  }

  /**
   * Tüm verileri yedekle
   */
  async createBackup(options?: {
    includeSettings?: boolean;
    includeNotes?: boolean;
    includeCalendar?: boolean;
    includeBlocking?: boolean;
    includeFavorites?: boolean;
  }): Promise<BackupResult> {
    try {
      await this.ensureBackupDir();

      const includeAll = !options;
      const backupData: BackupData = {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        deviceInfo: {
          platform: Platform.OS,
          appVersion: '1.0.0',
        },
        data: {},
      };

      // Ayarları yedekle
      if (includeAll || options?.includeSettings) {
        const settings = await AsyncStorage.getItem(STORAGE_KEYS.settings);
        if (settings) {
          backupData.data.settings = JSON.parse(settings);
        }
      }

      // Notları yedekle
      if (includeAll || options?.includeNotes) {
        const notes = await AsyncStorage.getItem(STORAGE_KEYS.notes);
        if (notes) {
          backupData.data.notes = JSON.parse(notes);
        }
      }

      // Takvimi yedekle
      if (includeAll || options?.includeCalendar) {
        const calendar = await AsyncStorage.getItem(STORAGE_KEYS.calendar);
        if (calendar) {
          backupData.data.calendar = JSON.parse(calendar);
        }
      }

      // Engelleme listesini yedekle
      if (includeAll || options?.includeBlocking) {
        const blocking = await AsyncStorage.getItem(STORAGE_KEYS.blocking);
        if (blocking) {
          backupData.data.blocking = JSON.parse(blocking);
        }
      }

      // Favorileri yedekle
      if (includeAll || options?.includeFavorites) {
        const favorites = await AsyncStorage.getItem(STORAGE_KEYS.favorites);
        if (favorites) {
          backupData.data.favorites = JSON.parse(favorites);
        }
      }

      // Dosya adını oluştur
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `lifecall_backup_${timestamp}${BACKUP_FILE_EXTENSION}`;
      const filePath = `${this.backupDir}/${fileName}`;

      // Dosyaya yaz
      await RNFS.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf8');

      // Dosya boyutunu al
      const stat = await RNFS.stat(filePath);

      return {
        success: true,
        filePath,
        fileName,
        size: stat.size,
      };
    } catch (error: any) {
      console.error('Backup creation failed:', error);
      return {
        success: false,
        error: error.message || 'Yedekleme oluşturulamadı',
      };
    }
  }

  /**
   * Yedekten geri yükle
   */
  async restoreBackup(filePath: string): Promise<RestoreResult> {
    try {
      // Dosyayı oku
      const content = await RNFS.readFile(filePath, 'utf8');
      const backupData: BackupData = JSON.parse(content);

      // Versiyon kontrolü
      if (!backupData.version) {
        return {
          success: false,
          restoredItems: [],
          error: 'Geçersiz yedekleme dosyası',
        };
      }

      const restoredItems: string[] = [];

      // Ayarları geri yükle
      if (backupData.data.settings) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.settings,
          JSON.stringify(backupData.data.settings)
        );
        restoredItems.push('settings');
      }

      // Notları geri yükle
      if (backupData.data.notes) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.notes,
          JSON.stringify(backupData.data.notes)
        );
        restoredItems.push('notes');
      }

      // Takvimi geri yükle
      if (backupData.data.calendar) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.calendar,
          JSON.stringify(backupData.data.calendar)
        );
        restoredItems.push('calendar');
      }

      // Engelleme listesini geri yükle
      if (backupData.data.blocking) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.blocking,
          JSON.stringify(backupData.data.blocking)
        );
        restoredItems.push('blocking');
      }

      // Favorileri geri yükle
      if (backupData.data.favorites) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.favorites,
          JSON.stringify(backupData.data.favorites)
        );
        restoredItems.push('favorites');
      }

      return {
        success: true,
        restoredItems,
      };
    } catch (error: any) {
      console.error('Restore failed:', error);
      return {
        success: false,
        restoredItems: [],
        error: error.message || 'Geri yükleme başarısız',
      };
    }
  }

  /**
   * Mevcut yedeklemeleri listele
   */
  async listBackups(): Promise<BackupListItem[]> {
    try {
      await this.ensureBackupDir();

      const files = await RNFS.readDir(this.backupDir);
      const backups: BackupListItem[] = [];

      for (const file of files) {
        if (file.name.endsWith(BACKUP_FILE_EXTENSION)) {
          backups.push({
            fileName: file.name,
            filePath: file.path,
            createdAt: new Date(file.mtime || Date.now()),
            size: file.size,
          });
        }
      }

      // En yeniden eskiye sırala
      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return backups;
    } catch (error) {
      console.error('List backups failed:', error);
      return [];
    }
  }

  /**
   * Yedekleme dosyasını sil
   */
  async deleteBackup(filePath: string): Promise<boolean> {
    try {
      await RNFS.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Delete backup failed:', error);
      return false;
    }
  }

  /**
   * Yedekleme dosyasını paylaş/dışa aktar
   */
  async shareBackup(filePath: string): Promise<boolean> {
    try {
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/json',
        failOnCancel: false,
      });
      return true;
    } catch (error) {
      console.error('Share backup failed:', error);
      return false;
    }
  }

  /**
   * Yedekleme dosyasını içe aktar
   */
  async importBackup(fileUri: string): Promise<RestoreResult> {
    try {
      // Dosyayı yedekleme klasörüne kopyala
      const fileName = `imported_${Date.now()}${BACKUP_FILE_EXTENSION}`;
      const destPath = `${this.backupDir}/${fileName}`;

      await RNFS.copyFile(fileUri, destPath);

      // Geri yükle
      return await this.restoreBackup(destPath);
    } catch (error: any) {
      console.error('Import backup failed:', error);
      return {
        success: false,
        restoredItems: [],
        error: error.message || 'İçe aktarma başarısız',
      };
    }
  }

  /**
   * Yedekleme dosyasının bilgilerini oku
   */
  async getBackupInfo(filePath: string): Promise<BackupData | null> {
    try {
      const content = await RNFS.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Get backup info failed:', error);
      return null;
    }
  }

  /**
   * Dosya boyutunu formatla
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Eski yedekleri temizle (belirli sayıdan fazlasını sil)
   */
  async cleanOldBackups(keepCount: number = 5): Promise<number> {
    try {
      const backups = await this.listBackups();
      let deletedCount = 0;

      if (backups.length > keepCount) {
        const toDelete = backups.slice(keepCount);
        for (const backup of toDelete) {
          const success = await this.deleteBackup(backup.filePath);
          if (success) deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Clean old backups failed:', error);
      return 0;
    }
  }
}

export const backupService = new BackupService();
export default backupService;
