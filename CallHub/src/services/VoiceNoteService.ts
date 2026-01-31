/**
 * LifeCall - Sesli Not Servisi
 *
 * Ses kaydı ve oynatma işlemleri:
 * - Kayıt başlatma/durdurma
 * - Oynatma kontrolü
 * - Ses dosyası yönetimi
 */

import { Platform, PermissionsAndroid } from 'react-native';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';

// Enable playback in silence mode on iOS
Sound.setCategory('Playback');

/**
 * Ses kaydı durumu
 */
export type RecordingState = 'idle' | 'recording' | 'paused';

/**
 * Oynatma durumu
 */
export type PlaybackState = 'idle' | 'playing' | 'paused' | 'stopped';

/**
 * Kayıt sonucu
 */
export interface RecordingResult {
  uri: string;
  duration: number; // saniye
  filename: string;
}

/**
 * Ses bilgisi
 */
export interface AudioInfo {
  duration: number;
  currentPosition: number;
  isPlaying: boolean;
}

/**
 * Callback tipleri
 */
type RecordingCallback = (
  state: RecordingState,
  duration: number
) => void;

type PlaybackCallback = (
  state: PlaybackState,
  currentPosition: number,
  duration: number
) => void;

/**
 * Sesli Not Servisi
 */
class VoiceNoteService {
  private currentSound: Sound | null = null;
  private recordingState: RecordingState = 'idle';
  private playbackState: PlaybackState = 'idle';
  private recordingDuration: number = 0;
  private recordingTimer: NodeJS.Timeout | null = null;
  private playbackTimer: NodeJS.Timeout | null = null;
  private recordingCallback: RecordingCallback | null = null;
  private playbackCallback: PlaybackCallback | null = null;

  // Simüle kayıt için (gerçek native kayıt modülü gerektirir)
  private mockRecordingStartTime: number = 0;
  private mockRecordingUri: string = '';

  /**
   * Mikrofon izni kontrolü (Android)
   */
  async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Mikrofon İzni',
          message: 'Sesli not kaydetmek için mikrofon erişimi gerekiyor.',
          buttonPositive: 'İzin Ver',
          buttonNegative: 'Reddet',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Mikrofon izni hatası:', error);
      return false;
    }
  }

  /**
   * Kayıt dizinini al
   */
  private getRecordingsDirectory(): string {
    return Platform.OS === 'android'
      ? `${RNFS.DocumentDirectoryPath}/voice_notes`
      : `${RNFS.DocumentDirectoryPath}/voice_notes`;
  }

  /**
   * Kayıt dizinini oluştur
   */
  private async ensureRecordingsDirectory(): Promise<void> {
    const dir = this.getRecordingsDirectory();
    const exists = await RNFS.exists(dir);
    if (!exists) {
      await RNFS.mkdir(dir);
    }
  }

  /**
   * Benzersiz dosya adı oluştur
   */
  private generateFilename(): string {
    const timestamp = Date.now();
    return `voice_note_${timestamp}.m4a`;
  }

  /**
   * Kaydı başlat
   */
  async startRecording(callback?: RecordingCallback): Promise<boolean> {
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      console.error('Mikrofon izni yok');
      return false;
    }

    try {
      await this.ensureRecordingsDirectory();

      const filename = this.generateFilename();
      const filePath = `${this.getRecordingsDirectory()}/${filename}`;

      // Mevcut kaydı temizle
      this.stopRecording();

      // Native kayıt modülü burada çağrılır
      // Şimdilik simüle ediyoruz
      this.mockRecordingStartTime = Date.now();
      this.mockRecordingUri = filePath;

      this.recordingState = 'recording';
      this.recordingDuration = 0;
      this.recordingCallback = callback || null;

      // Süre sayacını başlat
      this.recordingTimer = setInterval(() => {
        this.recordingDuration = Math.floor((Date.now() - this.mockRecordingStartTime) / 1000);
        if (this.recordingCallback) {
          this.recordingCallback(this.recordingState, this.recordingDuration);
        }
      }, 100);

      if (this.recordingCallback) {
        this.recordingCallback('recording', 0);
      }

      console.log('Kayıt başladı:', filePath);
      return true;
    } catch (error) {
      console.error('Kayıt başlatma hatası:', error);
      return false;
    }
  }

  /**
   * Kaydı durdur ve kaydet
   */
  async stopRecording(): Promise<RecordingResult | null> {
    if (this.recordingState === 'idle') {
      return null;
    }

    try {
      // Zamanlayıcıyı temizle
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }

      const duration = this.recordingDuration;
      const uri = this.mockRecordingUri;
      const filename = uri.split('/').pop() || 'voice_note.m4a';

      // Native kayıt durdurma burada çağrılır
      // Demo için boş dosya oluştur
      try {
        // Gerçek uygulamada native modül ses dosyasını oluşturur
        // Burada sadece placeholder oluşturuyoruz
        const exists = await RNFS.exists(uri);
        if (!exists) {
          await RNFS.writeFile(uri, '', 'utf8');
        }
      } catch (e) {
        // İgnore
      }

      this.recordingState = 'idle';
      this.recordingDuration = 0;

      if (this.recordingCallback) {
        this.recordingCallback('idle', 0);
        this.recordingCallback = null;
      }

      console.log('Kayıt tamamlandı:', uri, 'Süre:', duration);

      return {
        uri,
        duration,
        filename,
      };
    } catch (error) {
      console.error('Kayıt durdurma hatası:', error);
      return null;
    }
  }

  /**
   * Kaydı iptal et
   */
  cancelRecording(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    this.recordingState = 'idle';
    this.recordingDuration = 0;

    if (this.recordingCallback) {
      this.recordingCallback('idle', 0);
      this.recordingCallback = null;
    }

    // Oluşturulan dosyayı sil
    if (this.mockRecordingUri) {
      RNFS.unlink(this.mockRecordingUri).catch(() => {});
      this.mockRecordingUri = '';
    }
  }

  /**
   * Kayıt durumunu al
   */
  getRecordingState(): RecordingState {
    return this.recordingState;
  }

  /**
   * Kayıt süresini al
   */
  getRecordingDuration(): number {
    return this.recordingDuration;
  }

  /**
   * Ses dosyasını çal
   */
  async play(
    uri: string,
    callback?: PlaybackCallback
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Mevcut sesi durdur
        this.stop();

        this.playbackCallback = callback || null;

        // Dosya yolunu düzenle
        let soundPath = uri;
        if (Platform.OS === 'android' && !uri.startsWith('file://')) {
          soundPath = uri;
        } else if (Platform.OS === 'ios' && uri.startsWith('file://')) {
          soundPath = uri.replace('file://', '');
        }

        this.currentSound = new Sound(soundPath, '', (error) => {
          if (error) {
            console.error('Ses yükleme hatası:', error);
            this.playbackState = 'stopped';
            resolve(false);
            return;
          }

          if (this.currentSound) {
            const duration = this.currentSound.getDuration();

            this.playbackState = 'playing';

            // Oynatma ilerlemesini izle
            this.playbackTimer = setInterval(() => {
              if (this.currentSound && this.playbackState === 'playing') {
                this.currentSound.getCurrentTime((seconds) => {
                  if (this.playbackCallback) {
                    this.playbackCallback('playing', seconds, duration);
                  }
                });
              }
            }, 100);

            this.currentSound.play((success) => {
              if (this.playbackTimer) {
                clearInterval(this.playbackTimer);
                this.playbackTimer = null;
              }

              this.playbackState = 'stopped';

              if (this.playbackCallback) {
                this.playbackCallback('stopped', duration, duration);
              }

              console.log('Oynatma tamamlandı:', success);
            });

            if (this.playbackCallback) {
              this.playbackCallback('playing', 0, duration);
            }

            resolve(true);
          }
        });
      } catch (error) {
        console.error('Oynatma hatası:', error);
        this.playbackState = 'stopped';
        resolve(false);
      }
    });
  }

  /**
   * Oynatmayı duraklat
   */
  pause(): void {
    if (this.currentSound && this.playbackState === 'playing') {
      this.currentSound.pause();
      this.playbackState = 'paused';

      if (this.playbackTimer) {
        clearInterval(this.playbackTimer);
        this.playbackTimer = null;
      }

      if (this.playbackCallback) {
        this.currentSound.getCurrentTime((seconds) => {
          const duration = this.currentSound?.getDuration() || 0;
          if (this.playbackCallback) {
            this.playbackCallback('paused', seconds, duration);
          }
        });
      }
    }
  }

  /**
   * Oynatmayı devam ettir
   */
  resume(): void {
    if (this.currentSound && this.playbackState === 'paused') {
      this.currentSound.play((success) => {
        if (this.playbackTimer) {
          clearInterval(this.playbackTimer);
          this.playbackTimer = null;
        }

        this.playbackState = 'stopped';

        if (this.playbackCallback) {
          const duration = this.currentSound?.getDuration() || 0;
          this.playbackCallback('stopped', duration, duration);
        }
      });

      this.playbackState = 'playing';

      // Oynatma ilerlemesini izle
      this.playbackTimer = setInterval(() => {
        if (this.currentSound && this.playbackState === 'playing') {
          this.currentSound.getCurrentTime((seconds) => {
            const duration = this.currentSound?.getDuration() || 0;
            if (this.playbackCallback) {
              this.playbackCallback('playing', seconds, duration);
            }
          });
        }
      }, 100);
    }
  }

  /**
   * Oynatmayı durdur
   */
  stop(): void {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }

    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound.release();
      this.currentSound = null;
    }

    this.playbackState = 'idle';
    this.playbackCallback = null;
  }

  /**
   * Belirli pozisyona git
   */
  seekTo(seconds: number): void {
    if (this.currentSound) {
      this.currentSound.setCurrentTime(seconds);
    }
  }

  /**
   * Oynatma durumunu al
   */
  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  /**
   * Ses dosyasını sil
   */
  async deleteRecording(uri: string): Promise<boolean> {
    try {
      const exists = await RNFS.exists(uri);
      if (exists) {
        await RNFS.unlink(uri);
        console.log('Ses dosyası silindi:', uri);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ses dosyası silme hatası:', error);
      return false;
    }
  }

  /**
   * Ses dosyası bilgisini al
   */
  async getAudioInfo(uri: string): Promise<{ duration: number } | null> {
    return new Promise((resolve) => {
      try {
        let soundPath = uri;
        if (Platform.OS === 'android' && !uri.startsWith('file://')) {
          soundPath = uri;
        } else if (Platform.OS === 'ios' && uri.startsWith('file://')) {
          soundPath = uri.replace('file://', '');
        }

        const sound = new Sound(soundPath, '', (error) => {
          if (error) {
            console.error('Ses bilgisi alınamadı:', error);
            resolve(null);
            return;
          }

          const duration = sound.getDuration();
          sound.release();
          resolve({ duration });
        });
      } catch (error) {
        console.error('Ses bilgisi hatası:', error);
        resolve(null);
      }
    });
  }

  /**
   * Süreyi formatla (mm:ss)
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Tüm kaynakları temizle
   */
  cleanup(): void {
    this.cancelRecording();
    this.stop();
  }
}

// Singleton instance
export const voiceNoteService = new VoiceNoteService();

export default voiceNoteService;
