/**
 * LifeCall - Blocking Native Module TypeScript Wrapper
 *
 * Android BlockedNumberContract API'si için TypeScript arayüzü
 */

import { NativeModules, Platform } from 'react-native';

interface BlockedNumberData {
  id: string;
  phoneNumber: string;
  normalizedNumber?: string;
}

interface BlockingModuleInterface {
  /**
   * Uygulama BlockedNumberContract API'sini kullanabilir mi?
   * (Varsayılan telefon uygulaması olmalı)
   */
  canUseBlockedNumbersApi(): Promise<boolean>;

  /**
   * Numarayı sistem engelli listesine ekle
   */
  addToBlocklist(phoneNumber: string): Promise<boolean>;

  /**
   * Numarayı sistem engelli listesinden kaldır
   */
  removeFromBlocklist(phoneNumber: string): Promise<boolean>;

  /**
   * Numara sistem tarafından engelli mi?
   */
  isNumberBlocked(phoneNumber: string): Promise<boolean>;

  /**
   * Tüm sistem engelli numaralarını al
   */
  getBlockedNumbers(): Promise<BlockedNumberData[]>;

  /**
   * Birden fazla numarayı engelle
   */
  blockMultipleNumbers(numbers: { [key: string]: string }): Promise<boolean>;

  /**
   * Tüm engelli numaraları temizle
   */
  clearAllBlocked(): Promise<number>;

  /**
   * Sistem engelli numara ayarlarını aç
   */
  openBlockedNumbersSettings(): Promise<boolean>;

  /**
   * Engelli numara sayısını al
   */
  getBlockedCount(): Promise<number>;
}

// Native modül
const NativeBlockingModule: BlockingModuleInterface | undefined =
  Platform.OS === 'android' ? NativeModules.BlockingModule : undefined;

/**
 * Blocking Module
 */
class BlockingModule {
  private isAvailable: boolean = false;
  private availabilityChecked: boolean = false;

  /**
   * API kullanılabilir mi kontrol et
   */
  async checkAvailability(): Promise<boolean> {
    if (this.availabilityChecked) {
      return this.isAvailable;
    }

    if (!NativeBlockingModule) {
      this.isAvailable = false;
      this.availabilityChecked = true;
      return false;
    }

    try {
      this.isAvailable = await NativeBlockingModule.canUseBlockedNumbersApi();
    } catch (error) {
      console.warn('BlockingModule availability check failed:', error);
      this.isAvailable = false;
    }

    this.availabilityChecked = true;
    return this.isAvailable;
  }

  /**
   * API kullanılabilir mi?
   */
  get available(): boolean {
    return this.isAvailable;
  }

  /**
   * Numarayı engelle
   */
  async block(phoneNumber: string): Promise<boolean> {
    if (!NativeBlockingModule) {
      console.warn('BlockingModule not available on this platform');
      return false;
    }

    try {
      return await NativeBlockingModule.addToBlocklist(phoneNumber);
    } catch (error: any) {
      console.error('Failed to block number:', error);

      // Eğer varsayılan uygulama değilse kullanıcıyı yönlendir
      if (error.code === 'PERMISSION_DENIED') {
        // TODO: Kullanıcıya varsayılan uygulama ayarını açmasını söyle
      }

      throw error;
    }
  }

  /**
   * Engeli kaldır
   */
  async unblock(phoneNumber: string): Promise<boolean> {
    if (!NativeBlockingModule) {
      console.warn('BlockingModule not available on this platform');
      return false;
    }

    try {
      return await NativeBlockingModule.removeFromBlocklist(phoneNumber);
    } catch (error) {
      console.error('Failed to unblock number:', error);
      throw error;
    }
  }

  /**
   * Numara engelli mi?
   */
  async isBlocked(phoneNumber: string): Promise<boolean> {
    if (!NativeBlockingModule) {
      return false;
    }

    try {
      return await NativeBlockingModule.isNumberBlocked(phoneNumber);
    } catch (error) {
      console.error('Failed to check blocked status:', error);
      return false;
    }
  }

  /**
   * Tüm engelli numaraları al
   */
  async getAll(): Promise<BlockedNumberData[]> {
    if (!NativeBlockingModule) {
      return [];
    }

    try {
      return await NativeBlockingModule.getBlockedNumbers();
    } catch (error) {
      console.error('Failed to get blocked numbers:', error);
      return [];
    }
  }

  /**
   * Engelli sayısını al
   */
  async getCount(): Promise<number> {
    if (!NativeBlockingModule) {
      return 0;
    }

    try {
      return await NativeBlockingModule.getBlockedCount();
    } catch (error) {
      console.error('Failed to get blocked count:', error);
      return 0;
    }
  }

  /**
   * Toplu engelleme
   */
  async blockMany(phoneNumbers: string[]): Promise<boolean> {
    if (!NativeBlockingModule) {
      return false;
    }

    // Şimdilik tek tek engelle
    // TODO: Native batch implement edildiğinde güncelle
    try {
      for (const number of phoneNumbers) {
        await this.block(number);
      }
      return true;
    } catch (error) {
      console.error('Failed to block multiple numbers:', error);
      return false;
    }
  }

  /**
   * Tümünü temizle
   */
  async clearAll(): Promise<number> {
    if (!NativeBlockingModule) {
      return 0;
    }

    try {
      return await NativeBlockingModule.clearAllBlocked();
    } catch (error) {
      console.error('Failed to clear blocked numbers:', error);
      throw error;
    }
  }

  /**
   * Sistem ayarlarını aç
   */
  async openSettings(): Promise<boolean> {
    if (!NativeBlockingModule) {
      return false;
    }

    try {
      return await NativeBlockingModule.openBlockedNumbersSettings();
    } catch (error) {
      console.error('Failed to open blocked numbers settings:', error);
      return false;
    }
  }
}

// Singleton instance
const blockingModule = new BlockingModule();

export default blockingModule;

// Named exports
export {
  BlockingModule,
  BlockedNumberData,
};
