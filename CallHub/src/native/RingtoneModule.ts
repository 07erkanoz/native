/**
 * LifeCall - Zil Sesi Modülü (TypeScript)
 *
 * Android sistem zil seslerini ve özel zil seslerini yönetir.
 */

import { NativeModules, Platform } from 'react-native';

const { RingtoneModule } = NativeModules;

/**
 * Zil sesi bilgisi
 */
export interface RingtoneInfo {
  id: string;
  title: string;
  uri: string;
  type: 'system' | 'notification' | 'custom';
  path?: string;
  duration?: number;
}

/**
 * Kişi zil sesi bilgisi
 */
export interface ContactRingtoneInfo {
  uri: string | null;
  title: string;
  hasCustomRingtone: boolean;
}

/**
 * Zil Sesi Servisi
 */
class RingtoneService {
  private isAndroid = Platform.OS === 'android';

  /**
   * Sistem zil seslerini listele
   */
  async getSystemRingtones(): Promise<RingtoneInfo[]> {
    if (!this.isAndroid) return [];

    try {
      return await RingtoneModule.getSystemRingtones();
    } catch (error) {
      console.error('getSystemRingtones error:', error);
      return [];
    }
  }

  /**
   * Bildirim seslerini listele
   */
  async getNotificationSounds(): Promise<RingtoneInfo[]> {
    if (!this.isAndroid) return [];

    try {
      return await RingtoneModule.getNotificationSounds();
    } catch (error) {
      console.error('getNotificationSounds error:', error);
      return [];
    }
  }

  /**
   * Özel/indirilen zil seslerini listele
   */
  async getCustomRingtones(): Promise<RingtoneInfo[]> {
    if (!this.isAndroid) return [];

    try {
      return await RingtoneModule.getCustomRingtones();
    } catch (error) {
      console.error('getCustomRingtones error:', error);
      return [];
    }
  }

  /**
   * Tüm zil seslerini al (sistem + özel)
   */
  async getAllRingtones(): Promise<{
    system: RingtoneInfo[];
    custom: RingtoneInfo[];
  }> {
    const [system, custom] = await Promise.all([
      this.getSystemRingtones(),
      this.getCustomRingtones(),
    ]);

    return { system, custom };
  }

  /**
   * Varsayılan zil sesini al
   */
  async getDefaultRingtone(): Promise<{ uri: string | null; title: string }> {
    if (!this.isAndroid) {
      return { uri: null, title: 'Varsayılan' };
    }

    try {
      return await RingtoneModule.getDefaultRingtone();
    } catch (error) {
      console.error('getDefaultRingtone error:', error);
      return { uri: null, title: 'Varsayılan' };
    }
  }

  /**
   * Zil sesini önizle (çal)
   */
  async playRingtone(uri: string): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      return await RingtoneModule.playRingtone(uri);
    } catch (error) {
      console.error('playRingtone error:', error);
      return false;
    }
  }

  /**
   * Zil sesini durdur
   */
  async stopRingtone(): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      return await RingtoneModule.stopRingtone();
    } catch (error) {
      console.error('stopRingtone error:', error);
      return false;
    }
  }

  /**
   * URI'den zil sesi başlığını al
   */
  async getRingtoneTitle(uri: string): Promise<string> {
    if (!this.isAndroid) return 'Bilinmeyen';

    try {
      return await RingtoneModule.getRingtoneTitle(uri);
    } catch (error) {
      return 'Bilinmeyen';
    }
  }

  /**
   * Kişiye özel zil sesi ayarla
   */
  async setContactRingtone(contactId: string, ringtoneUri: string): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      return await RingtoneModule.setContactRingtone(contactId, ringtoneUri);
    } catch (error) {
      console.error('setContactRingtone error:', error);
      return false;
    }
  }

  /**
   * Kişinin özel zil sesini al
   */
  async getContactRingtone(contactId: string): Promise<ContactRingtoneInfo> {
    if (!this.isAndroid) {
      return { uri: null, title: 'Varsayılan', hasCustomRingtone: false };
    }

    try {
      return await RingtoneModule.getContactRingtone(contactId);
    } catch (error) {
      console.error('getContactRingtone error:', error);
      return { uri: null, title: 'Varsayılan', hasCustomRingtone: false };
    }
  }

  /**
   * Kişinin özel zil sesini kaldır
   */
  async removeContactRingtone(contactId: string): Promise<boolean> {
    if (!this.isAndroid) return false;

    try {
      return await RingtoneModule.removeContactRingtone(contactId);
    } catch (error) {
      console.error('removeContactRingtone error:', error);
      return false;
    }
  }
}

export const ringtoneService = new RingtoneService();
export default ringtoneService;
