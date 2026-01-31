/**
 * LifeCall - Resim Ekleme Servisi
 *
 * Notlara resim ekleme ve yönetme işlemleri.
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { NoteAttachment } from '../../types/notes';

// Resim kayıt dizini
const IMAGE_DIRECTORY = `${RNFS.DocumentDirectoryPath}/note_images`;

// Maksimum resim boyutu (piksel)
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;

// Maksimum dosya boyutu (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Resim seçme sonucu
 */
export interface ImagePickResult {
  success: boolean;
  attachment?: NoteAttachment;
  error?: string;
}

/**
 * Resim Ekleme Servisi
 */
class ImageAttachmentService {
  private isInitialized = false;

  /**
   * Servisi başlat (dizin oluştur)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const exists = await RNFS.exists(IMAGE_DIRECTORY);
      if (!exists) {
        await RNFS.mkdir(IMAGE_DIRECTORY);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('ImageAttachmentService initialize error:', error);
    }
  }

  /**
   * Kamera iznini kontrol et ve iste
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Kamera İzni',
          message: 'Not için fotoğraf çekmek için kamera erişimi gerekiyor.',
          buttonNeutral: 'Daha Sonra',
          buttonNegative: 'İptal',
          buttonPositive: 'Tamam',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('requestCameraPermission error:', error);
      return false;
    }
  }

  /**
   * Galeri iznini kontrol et ve iste
   */
  async requestGalleryPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      // Android 13+ için READ_MEDIA_IMAGES
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Galeri İzni',
            message: 'Not için resim seçmek için galeri erişimi gerekiyor.',
            buttonNeutral: 'Daha Sonra',
            buttonNegative: 'İptal',
            buttonPositive: 'Tamam',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Android 12 ve altı için READ_EXTERNAL_STORAGE
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Depolama İzni',
            message: 'Not için resim seçmek için depolama erişimi gerekiyor.',
            buttonNeutral: 'Daha Sonra',
            buttonNegative: 'İptal',
            buttonPositive: 'Tamam',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('requestGalleryPermission error:', error);
      return false;
    }
  }

  /**
   * Kameradan fotoğraf çek
   */
  async takePhoto(): Promise<ImagePickResult> {
    await this.initialize();

    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      return {
        success: false,
        error: 'Kamera izni verilmedi',
      };
    }

    const options: CameraOptions = {
      mediaType: 'photo',
      maxWidth: MAX_IMAGE_WIDTH,
      maxHeight: MAX_IMAGE_HEIGHT,
      quality: 0.8,
      saveToPhotos: false,
      includeBase64: false,
    };

    return new Promise((resolve) => {
      launchCamera(options, async (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve({ success: false, error: 'İptal edildi' });
          return;
        }

        if (response.errorCode) {
          resolve({ success: false, error: response.errorMessage || 'Kamera hatası' });
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          const result = await this.saveImage(asset);
          resolve(result);
        } else {
          resolve({ success: false, error: 'Resim alınamadı' });
        }
      });
    });
  }

  /**
   * Galeriden resim seç
   */
  async pickFromGallery(): Promise<ImagePickResult> {
    await this.initialize();

    const hasPermission = await this.requestGalleryPermission();
    if (!hasPermission) {
      return {
        success: false,
        error: 'Galeri izni verilmedi',
      };
    }

    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      maxWidth: MAX_IMAGE_WIDTH,
      maxHeight: MAX_IMAGE_HEIGHT,
      quality: 0.8,
      includeBase64: false,
      selectionLimit: 1,
    };

    return new Promise((resolve) => {
      launchImageLibrary(options, async (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve({ success: false, error: 'İptal edildi' });
          return;
        }

        if (response.errorCode) {
          resolve({ success: false, error: response.errorMessage || 'Galeri hatası' });
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          const result = await this.saveImage(asset);
          resolve(result);
        } else {
          resolve({ success: false, error: 'Resim seçilemedi' });
        }
      });
    });
  }

  /**
   * Birden fazla resim seç
   */
  async pickMultipleFromGallery(maxImages: number = 5): Promise<ImagePickResult[]> {
    await this.initialize();

    const hasPermission = await this.requestGalleryPermission();
    if (!hasPermission) {
      return [{ success: false, error: 'Galeri izni verilmedi' }];
    }

    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      maxWidth: MAX_IMAGE_WIDTH,
      maxHeight: MAX_IMAGE_HEIGHT,
      quality: 0.8,
      includeBase64: false,
      selectionLimit: maxImages,
    };

    return new Promise((resolve) => {
      launchImageLibrary(options, async (response: ImagePickerResponse) => {
        if (response.didCancel) {
          resolve([{ success: false, error: 'İptal edildi' }]);
          return;
        }

        if (response.errorCode) {
          resolve([{ success: false, error: response.errorMessage || 'Galeri hatası' }]);
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const results: ImagePickResult[] = [];
          for (const asset of response.assets) {
            const result = await this.saveImage(asset);
            results.push(result);
          }
          resolve(results);
        } else {
          resolve([{ success: false, error: 'Resim seçilemedi' }]);
        }
      });
    });
  }

  /**
   * Resmi kalıcı olarak kaydet
   */
  private async saveImage(asset: any): Promise<ImagePickResult> {
    try {
      const sourceUri = asset.uri;
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;
      const fileSize = asset.fileSize || 0;
      const mimeType = asset.type || 'image/jpeg';

      // Dosya boyutu kontrolü
      if (fileSize > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `Dosya boyutu çok büyük (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        };
      }

      // Hedef yol
      const destPath = `${IMAGE_DIRECTORY}/${Date.now()}_${fileName}`;

      // Dosyayı kopyala
      await RNFS.copyFile(sourceUri, destPath);

      // Attachment objesi oluştur
      const attachment: NoteAttachment = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'image',
        uri: destPath,
        name: fileName,
        size: fileSize,
        mimeType,
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        attachment,
      };
    } catch (error: any) {
      console.error('saveImage error:', error);
      return {
        success: false,
        error: error.message || 'Resim kaydedilemedi',
      };
    }
  }

  /**
   * Resmi sil
   */
  async deleteImage(attachment: NoteAttachment): Promise<boolean> {
    try {
      const exists = await RNFS.exists(attachment.uri);
      if (exists) {
        await RNFS.unlink(attachment.uri);
      }
      return true;
    } catch (error) {
      console.error('deleteImage error:', error);
      return false;
    }
  }

  /**
   * Birden fazla resmi sil
   */
  async deleteImages(attachments: NoteAttachment[]): Promise<boolean> {
    try {
      for (const attachment of attachments) {
        await this.deleteImage(attachment);
      }
      return true;
    } catch (error) {
      console.error('deleteImages error:', error);
      return false;
    }
  }

  /**
   * Resim seçenekleri diyaloğu göster
   */
  showImagePickerOptions(onCamera: () => void, onGallery: () => void): void {
    Alert.alert(
      'Resim Ekle',
      'Resim kaynağını seçin',
      [
        {
          text: 'Kamera',
          onPress: onCamera,
        },
        {
          text: 'Galeri',
          onPress: onGallery,
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }

  /**
   * Kullanılmayan resimleri temizle
   * (Notlarda referans edilmeyen resimler)
   */
  async cleanupOrphanedImages(usedImageUris: string[]): Promise<number> {
    try {
      await this.initialize();

      const files = await RNFS.readDir(IMAGE_DIRECTORY);
      let deletedCount = 0;

      for (const file of files) {
        if (!usedImageUris.includes(file.path)) {
          await RNFS.unlink(file.path);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('cleanupOrphanedImages error:', error);
      return 0;
    }
  }

  /**
   * Toplam resim boyutunu hesapla
   */
  async getTotalImageSize(): Promise<number> {
    try {
      await this.initialize();

      const files = await RNFS.readDir(IMAGE_DIRECTORY);
      let totalSize = 0;

      for (const file of files) {
        totalSize += file.size;
      }

      return totalSize;
    } catch (error) {
      console.error('getTotalImageSize error:', error);
      return 0;
    }
  }

  /**
   * Resim dosyasının var olup olmadığını kontrol et
   */
  async imageExists(uri: string): Promise<boolean> {
    try {
      return await RNFS.exists(uri);
    } catch (error) {
      return false;
    }
  }

  /**
   * Boyutu okunabilir formata çevir
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const imageAttachmentService = new ImageAttachmentService();
export default imageAttachmentService;
