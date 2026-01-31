/**
 * LifeCall - Arama Engelleme ve Spam Tipleri
 *
 * Kara liste ve spam raporlama sistemi
 */

// ==================== Engelleme Tipleri ====================

/**
 * Engelleme nedeni
 */
export type BlockReason =
  | 'user_blocked'      // Kullanıcı manuel engelledi
  | 'spam_reported'     // Spam olarak raporlandı
  | 'scam_reported'     // Dolandırıcı olarak raporlandı
  | 'telemarketing'     // Pazarlama araması
  | 'robocall'          // Otomatik arama
  | 'unknown_caller'    // Bilinmeyen arayan (otomatik engel)
  | 'private_number'    // Gizli numara
  | 'imported';         // İçe aktarılmış

/**
 * Engellenen numara
 */
export interface BlockedNumber {
  id: string;
  phoneNumber: string;
  normalizedNumber: string;        // E.164 format (+905551234567)
  displayName?: string;            // Varsa kişi adı
  reason: BlockReason;
  customReason?: string;           // Özel neden açıklaması
  blockedAt: string;               // ISO timestamp
  callAttempts: number;            // Engellendiğinden beri arama sayısı
  lastCallAttempt?: string;        // Son arama denemesi
  isSystemBlocked: boolean;        // Android BlockedNumberContract'a ekli mi
  source: 'local' | 'cloud';       // Yerel mi, bulut mu
}

/**
 * Sessize alınmış kişi (aramalar gelir ama sessiz)
 */
export interface MutedContact {
  id: string;
  contactId?: string;
  phoneNumber: string;
  normalizedNumber: string;
  displayName?: string;
  mutedAt: string;
  reason?: string;
  muteUntil?: string;              // Belirli tarihe kadar sessize al
  isPermanent: boolean;
}

// ==================== Spam Raporlama Tipleri ====================

/**
 * Spam kategorisi
 */
export type SpamCategory =
  | 'spam'              // Genel spam
  | 'scam'              // Dolandırıcılık
  | 'telemarketing'     // Pazarlama
  | 'robocall'          // Otomatik arama
  | 'survey'            // Anket
  | 'debt_collector'    // Borç tahsilat
  | 'political'         // Siyasi
  | 'charity'           // Yardım kuruluşu
  | 'other';            // Diğer

/**
 * Spam rapor durumu
 */
export type SpamReportStatus =
  | 'pending'           // Beklemede
  | 'verified'          // Doğrulandı
  | 'rejected'          // Reddedildi
  | 'under_review';     // İnceleniyor

/**
 * Kullanıcıdan gelen spam raporu
 */
export interface SpamReport {
  id: string;
  phoneNumber: string;
  normalizedNumber: string;
  category: SpamCategory;
  description?: string;
  reportedBy: string;              // User ID (anonim)
  reportedAt: string;
  callerName?: string;             // Arayan kendini nasıl tanıttı
  callDuration?: number;           // Saniye
  status: SpamReportStatus;
}

/**
 * Bulut spam veritabanındaki numara
 */
export interface SpamNumber {
  id: string;
  phoneNumber: string;
  normalizedNumber: string;
  category: SpamCategory;
  reportCount: number;             // Toplam rapor sayısı
  verifiedCount: number;           // Doğrulanmış rapor sayısı
  spamScore: number;               // 0-100 arası spam skoru
  firstReportedAt: string;
  lastReportedAt: string;
  callerNames: string[];           // Bildirilen isimler
  isVerified: boolean;             // Admin tarafından doğrulandı mı
  country: string;                 // Ülke kodu (TR, US, vb.)
}

/**
 * Spam kontrol sonucu
 */
export interface SpamCheckResult {
  phoneNumber: string;
  isSpam: boolean;
  spamScore: number;               // 0-100
  category?: SpamCategory;
  reportCount: number;
  isVerified: boolean;
  source: 'local' | 'cloud' | 'api';
  checkedAt: string;
}

// ==================== Engelleme Ayarları ====================

/**
 * Engelleme ayarları
 */
export interface BlockingSettings {
  // Genel ayarlar
  isEnabled: boolean;                    // Engelleme sistemi aktif mi
  blockUnknownCallers: boolean;          // Rehberde olmayan numaraları engelle
  blockPrivateNumbers: boolean;          // Gizli numaraları engelle
  blockInternationalCalls: boolean;      // Uluslararası aramaları engelle

  // Spam koruma
  spamProtectionEnabled: boolean;        // Otomatik spam koruması
  autoBlockSpamThreshold: number;        // Bu skorun üzerini otomatik engelle (0-100)
  showSpamWarning: boolean;              // Spam şüphesi uyarısı göster

  // Bildirimler
  notifyBlockedCalls: boolean;           // Engellenen aramalar için bildirim
  logBlockedCalls: boolean;              // Engellenen aramaları kaydet

  // Bulut senkronizasyon
  syncWithCloud: boolean;                // Bulut veritabanıyla senkronize
  contributeToDatabase: boolean;         // Spam raporlarını paylaş

  // Sessiz mod
  silentModeEnabled: boolean;            // Sessize alınan kişiler var mı
}

// ==================== Redux State ====================

/**
 * Blocking slice state
 */
export interface BlockingState {
  // Engelli numaralar
  blockedNumbers: BlockedNumber[];
  mutedContacts: MutedContact[];

  // Spam verileri
  localSpamList: SpamNumber[];           // Yerel spam listesi
  pendingReports: SpamReport[];          // Gönderilmemiş raporlar

  // Cache
  spamCheckCache: Record<string, SpamCheckResult>;

  // Ayarlar
  settings: BlockingSettings;

  // UI state
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncAt?: string;
  error?: string;

  // İstatistikler
  stats: {
    totalBlocked: number;
    blockedToday: number;
    spamDetected: number;
    reportsSubmitted: number;
  };
}

// ==================== Payload Tipleri ====================

export interface BlockNumberPayload {
  phoneNumber: string;
  reason: BlockReason;
  customReason?: string;
  displayName?: string;
}

export interface UnblockNumberPayload {
  phoneNumber: string;
  removeFromSystem?: boolean;       // Android sistem listesinden de kaldır
}

export interface ReportSpamPayload {
  phoneNumber: string;
  category: SpamCategory;
  description?: string;
  callerName?: string;
  callDuration?: number;
}

export interface MuteContactPayload {
  contactId?: string;
  phoneNumber: string;
  displayName?: string;
  reason?: string;
  muteUntil?: string;               // ISO timestamp veya undefined (süresiz)
}

// ==================== Sabitler ====================

/**
 * Spam kategorileri (UI için)
 */
export const SPAM_CATEGORIES: {
  value: SpamCategory;
  labelKey: string;
  icon: string;
  color: string;
}[] = [
  { value: 'spam', labelKey: 'spam', icon: 'alert-circle', color: '#FF9800' },
  { value: 'scam', labelKey: 'scam', icon: 'alert-octagon', color: '#F44336' },
  { value: 'telemarketing', labelKey: 'telemarketing', icon: 'phone-outgoing', color: '#9C27B0' },
  { value: 'robocall', labelKey: 'robocall', icon: 'robot', color: '#607D8B' },
  { value: 'survey', labelKey: 'survey', icon: 'clipboard-list', color: '#00BCD4' },
  { value: 'debt_collector', labelKey: 'debtCollector', icon: 'currency-usd', color: '#795548' },
  { value: 'political', labelKey: 'political', icon: 'account-voice', color: '#3F51B5' },
  { value: 'charity', labelKey: 'charity', icon: 'hand-heart', color: '#E91E63' },
  { value: 'other', labelKey: 'other', icon: 'help-circle', color: '#9E9E9E' },
];

/**
 * Engelleme nedenleri (UI için)
 */
export const BLOCK_REASONS: {
  value: BlockReason;
  labelKey: string;
  icon: string;
}[] = [
  { value: 'user_blocked', labelKey: 'userBlocked', icon: 'account-cancel' },
  { value: 'spam_reported', labelKey: 'spamReported', icon: 'alert-circle' },
  { value: 'scam_reported', labelKey: 'scamReported', icon: 'alert-octagon' },
  { value: 'telemarketing', labelKey: 'telemarketing', icon: 'phone-outgoing' },
  { value: 'robocall', labelKey: 'robocall', icon: 'robot' },
  { value: 'unknown_caller', labelKey: 'unknownCaller', icon: 'account-question' },
  { value: 'private_number', labelKey: 'privateNumber', icon: 'phone-off' },
  { value: 'imported', labelKey: 'imported', icon: 'import' },
];

/**
 * Spam skoru eşikleri
 */
export const SPAM_SCORE_THRESHOLDS = {
  LOW: 30,           // Düşük risk
  MEDIUM: 50,        // Orta risk
  HIGH: 70,          // Yüksek risk
  VERY_HIGH: 90,     // Çok yüksek risk
};

/**
 * Spam skoru renkleri
 */
export const getSpamScoreColor = (score: number): string => {
  if (score >= SPAM_SCORE_THRESHOLDS.VERY_HIGH) return '#D32F2F';
  if (score >= SPAM_SCORE_THRESHOLDS.HIGH) return '#F44336';
  if (score >= SPAM_SCORE_THRESHOLDS.MEDIUM) return '#FF9800';
  if (score >= SPAM_SCORE_THRESHOLDS.LOW) return '#FFC107';
  return '#4CAF50';
};

/**
 * Varsayılan engelleme ayarları
 */
export const DEFAULT_BLOCKING_SETTINGS: BlockingSettings = {
  isEnabled: true,
  blockUnknownCallers: false,
  blockPrivateNumbers: false,
  blockInternationalCalls: false,
  spamProtectionEnabled: true,
  autoBlockSpamThreshold: 80,
  showSpamWarning: true,
  notifyBlockedCalls: true,
  logBlockedCalls: true,
  syncWithCloud: true,
  contributeToDatabase: true,
  silentModeEnabled: false,
};
