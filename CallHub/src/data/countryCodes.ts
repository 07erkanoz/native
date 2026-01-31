/**
 * LifeCall - Ülke Telefon Kodları Veritabanı
 *
 * Arama sırasında ülke bilgisi göstermek için kullanılır.
 * +90 -> Türkiye, +1 -> ABD/Kanada, vb.
 */

export interface CountryCode {
  /** ISO 3166-1 alpha-2 ülke kodu (TR, US, DE, vb.) */
  code: string;
  /** Telefon kodu (+90, +1, +49, vb.) */
  dialCode: string;
  /** İngilizce ülke adı */
  name: string;
  /** Türkçe ülke adı */
  nameTr: string;
  /** Emoji bayrak */
  flag: string;
  /** Örnek telefon formatı */
  exampleFormat?: string;
  /** Numara uzunluğu (min-max) */
  numberLength?: { min: number; max: number };
}

/**
 * Tüm ülke kodları listesi (telefon koduna göre sıralı)
 * En yaygın kullanılan ülkeler önce
 */
export const COUNTRY_CODES: CountryCode[] = [
  // Türkiye
  {
    code: 'TR',
    dialCode: '+90',
    name: 'Turkey',
    nameTr: 'Türkiye',
    flag: '🇹🇷',
    exampleFormat: '+90 5XX XXX XX XX',
    numberLength: { min: 10, max: 10 },
  },

  // Kuzey Amerika
  {
    code: 'US',
    dialCode: '+1',
    name: 'United States',
    nameTr: 'Amerika Birleşik Devletleri',
    flag: '🇺🇸',
    exampleFormat: '+1 (XXX) XXX-XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'CA',
    dialCode: '+1',
    name: 'Canada',
    nameTr: 'Kanada',
    flag: '🇨🇦',
    exampleFormat: '+1 (XXX) XXX-XXXX',
    numberLength: { min: 10, max: 10 },
  },

  // Avrupa
  {
    code: 'DE',
    dialCode: '+49',
    name: 'Germany',
    nameTr: 'Almanya',
    flag: '🇩🇪',
    exampleFormat: '+49 XXX XXXXXXX',
    numberLength: { min: 10, max: 11 },
  },
  {
    code: 'GB',
    dialCode: '+44',
    name: 'United Kingdom',
    nameTr: 'Birleşik Krallık',
    flag: '🇬🇧',
    exampleFormat: '+44 XXXX XXXXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'FR',
    dialCode: '+33',
    name: 'France',
    nameTr: 'Fransa',
    flag: '🇫🇷',
    exampleFormat: '+33 X XX XX XX XX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'IT',
    dialCode: '+39',
    name: 'Italy',
    nameTr: 'İtalya',
    flag: '🇮🇹',
    exampleFormat: '+39 XXX XXX XXXX',
    numberLength: { min: 9, max: 10 },
  },
  {
    code: 'ES',
    dialCode: '+34',
    name: 'Spain',
    nameTr: 'İspanya',
    flag: '🇪🇸',
    exampleFormat: '+34 XXX XXX XXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'NL',
    dialCode: '+31',
    name: 'Netherlands',
    nameTr: 'Hollanda',
    flag: '🇳🇱',
    exampleFormat: '+31 X XXXXXXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'BE',
    dialCode: '+32',
    name: 'Belgium',
    nameTr: 'Belçika',
    flag: '🇧🇪',
    exampleFormat: '+32 XXX XX XX XX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'AT',
    dialCode: '+43',
    name: 'Austria',
    nameTr: 'Avusturya',
    flag: '🇦🇹',
    exampleFormat: '+43 XXX XXXXXXX',
    numberLength: { min: 10, max: 13 },
  },
  {
    code: 'CH',
    dialCode: '+41',
    name: 'Switzerland',
    nameTr: 'İsviçre',
    flag: '🇨🇭',
    exampleFormat: '+41 XX XXX XX XX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'SE',
    dialCode: '+46',
    name: 'Sweden',
    nameTr: 'İsveç',
    flag: '🇸🇪',
    exampleFormat: '+46 XX XXX XX XX',
    numberLength: { min: 7, max: 13 },
  },
  {
    code: 'NO',
    dialCode: '+47',
    name: 'Norway',
    nameTr: 'Norveç',
    flag: '🇳🇴',
    exampleFormat: '+47 XXX XX XXX',
    numberLength: { min: 8, max: 8 },
  },
  {
    code: 'DK',
    dialCode: '+45',
    name: 'Denmark',
    nameTr: 'Danimarka',
    flag: '🇩🇰',
    exampleFormat: '+45 XX XX XX XX',
    numberLength: { min: 8, max: 8 },
  },
  {
    code: 'FI',
    dialCode: '+358',
    name: 'Finland',
    nameTr: 'Finlandiya',
    flag: '🇫🇮',
    exampleFormat: '+358 XX XXX XXXX',
    numberLength: { min: 9, max: 11 },
  },
  {
    code: 'PL',
    dialCode: '+48',
    name: 'Poland',
    nameTr: 'Polonya',
    flag: '🇵🇱',
    exampleFormat: '+48 XXX XXX XXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'PT',
    dialCode: '+351',
    name: 'Portugal',
    nameTr: 'Portekiz',
    flag: '🇵🇹',
    exampleFormat: '+351 XXX XXX XXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'GR',
    dialCode: '+30',
    name: 'Greece',
    nameTr: 'Yunanistan',
    flag: '🇬🇷',
    exampleFormat: '+30 XXX XXX XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'CZ',
    dialCode: '+420',
    name: 'Czech Republic',
    nameTr: 'Çekya',
    flag: '🇨🇿',
    exampleFormat: '+420 XXX XXX XXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'HU',
    dialCode: '+36',
    name: 'Hungary',
    nameTr: 'Macaristan',
    flag: '🇭🇺',
    exampleFormat: '+36 XX XXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'RO',
    dialCode: '+40',
    name: 'Romania',
    nameTr: 'Romanya',
    flag: '🇷🇴',
    exampleFormat: '+40 XXX XXX XXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'BG',
    dialCode: '+359',
    name: 'Bulgaria',
    nameTr: 'Bulgaristan',
    flag: '🇧🇬',
    exampleFormat: '+359 XX XXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'IE',
    dialCode: '+353',
    name: 'Ireland',
    nameTr: 'İrlanda',
    flag: '🇮🇪',
    exampleFormat: '+353 XX XXX XXXX',
    numberLength: { min: 9, max: 9 },
  },

  // Rusya ve BDT
  {
    code: 'RU',
    dialCode: '+7',
    name: 'Russia',
    nameTr: 'Rusya',
    flag: '🇷🇺',
    exampleFormat: '+7 XXX XXX XX XX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'UA',
    dialCode: '+380',
    name: 'Ukraine',
    nameTr: 'Ukrayna',
    flag: '🇺🇦',
    exampleFormat: '+380 XX XXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'KZ',
    dialCode: '+7',
    name: 'Kazakhstan',
    nameTr: 'Kazakistan',
    flag: '🇰🇿',
    exampleFormat: '+7 XXX XXX XX XX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'AZ',
    dialCode: '+994',
    name: 'Azerbaijan',
    nameTr: 'Azerbaycan',
    flag: '🇦🇿',
    exampleFormat: '+994 XX XXX XX XX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'GE',
    dialCode: '+995',
    name: 'Georgia',
    nameTr: 'Gürcistan',
    flag: '🇬🇪',
    exampleFormat: '+995 XXX XXX XXX',
    numberLength: { min: 9, max: 9 },
  },

  // Orta Doğu
  {
    code: 'SA',
    dialCode: '+966',
    name: 'Saudi Arabia',
    nameTr: 'Suudi Arabistan',
    flag: '🇸🇦',
    exampleFormat: '+966 XX XXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'AE',
    dialCode: '+971',
    name: 'United Arab Emirates',
    nameTr: 'Birleşik Arap Emirlikleri',
    flag: '🇦🇪',
    exampleFormat: '+971 XX XXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'IL',
    dialCode: '+972',
    name: 'Israel',
    nameTr: 'İsrail',
    flag: '🇮🇱',
    exampleFormat: '+972 XX XXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'EG',
    dialCode: '+20',
    name: 'Egypt',
    nameTr: 'Mısır',
    flag: '🇪🇬',
    exampleFormat: '+20 XX XXXX XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'IQ',
    dialCode: '+964',
    name: 'Iraq',
    nameTr: 'Irak',
    flag: '🇮🇶',
    exampleFormat: '+964 XXX XXX XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'IR',
    dialCode: '+98',
    name: 'Iran',
    nameTr: 'İran',
    flag: '🇮🇷',
    exampleFormat: '+98 XXX XXX XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'JO',
    dialCode: '+962',
    name: 'Jordan',
    nameTr: 'Ürdün',
    flag: '🇯🇴',
    exampleFormat: '+962 X XXXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'KW',
    dialCode: '+965',
    name: 'Kuwait',
    nameTr: 'Kuveyt',
    flag: '🇰🇼',
    exampleFormat: '+965 XXXX XXXX',
    numberLength: { min: 8, max: 8 },
  },
  {
    code: 'LB',
    dialCode: '+961',
    name: 'Lebanon',
    nameTr: 'Lübnan',
    flag: '🇱🇧',
    exampleFormat: '+961 XX XXX XXX',
    numberLength: { min: 7, max: 8 },
  },
  {
    code: 'QA',
    dialCode: '+974',
    name: 'Qatar',
    nameTr: 'Katar',
    flag: '🇶🇦',
    exampleFormat: '+974 XXXX XXXX',
    numberLength: { min: 8, max: 8 },
  },
  {
    code: 'SY',
    dialCode: '+963',
    name: 'Syria',
    nameTr: 'Suriye',
    flag: '🇸🇾',
    exampleFormat: '+963 XXX XXX XXX',
    numberLength: { min: 9, max: 9 },
  },

  // Asya
  {
    code: 'CN',
    dialCode: '+86',
    name: 'China',
    nameTr: 'Çin',
    flag: '🇨🇳',
    exampleFormat: '+86 XXX XXXX XXXX',
    numberLength: { min: 11, max: 11 },
  },
  {
    code: 'JP',
    dialCode: '+81',
    name: 'Japan',
    nameTr: 'Japonya',
    flag: '🇯🇵',
    exampleFormat: '+81 XX XXXX XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'KR',
    dialCode: '+82',
    name: 'South Korea',
    nameTr: 'Güney Kore',
    flag: '🇰🇷',
    exampleFormat: '+82 XX XXXX XXXX',
    numberLength: { min: 9, max: 10 },
  },
  {
    code: 'IN',
    dialCode: '+91',
    name: 'India',
    nameTr: 'Hindistan',
    flag: '🇮🇳',
    exampleFormat: '+91 XXXXX XXXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'PK',
    dialCode: '+92',
    name: 'Pakistan',
    nameTr: 'Pakistan',
    flag: '🇵🇰',
    exampleFormat: '+92 XXX XXXXXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'ID',
    dialCode: '+62',
    name: 'Indonesia',
    nameTr: 'Endonezya',
    flag: '🇮🇩',
    exampleFormat: '+62 XXX XXX XXXX',
    numberLength: { min: 9, max: 12 },
  },
  {
    code: 'MY',
    dialCode: '+60',
    name: 'Malaysia',
    nameTr: 'Malezya',
    flag: '🇲🇾',
    exampleFormat: '+60 XX XXXX XXXX',
    numberLength: { min: 9, max: 10 },
  },
  {
    code: 'SG',
    dialCode: '+65',
    name: 'Singapore',
    nameTr: 'Singapur',
    flag: '🇸🇬',
    exampleFormat: '+65 XXXX XXXX',
    numberLength: { min: 8, max: 8 },
  },
  {
    code: 'TH',
    dialCode: '+66',
    name: 'Thailand',
    nameTr: 'Tayland',
    flag: '🇹🇭',
    exampleFormat: '+66 X XXXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'VN',
    dialCode: '+84',
    name: 'Vietnam',
    nameTr: 'Vietnam',
    flag: '🇻🇳',
    exampleFormat: '+84 XXX XXX XXXX',
    numberLength: { min: 9, max: 10 },
  },
  {
    code: 'PH',
    dialCode: '+63',
    name: 'Philippines',
    nameTr: 'Filipinler',
    flag: '🇵🇭',
    exampleFormat: '+63 XXX XXX XXXX',
    numberLength: { min: 10, max: 10 },
  },

  // Okyanusya
  {
    code: 'AU',
    dialCode: '+61',
    name: 'Australia',
    nameTr: 'Avustralya',
    flag: '🇦🇺',
    exampleFormat: '+61 X XXXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'NZ',
    dialCode: '+64',
    name: 'New Zealand',
    nameTr: 'Yeni Zelanda',
    flag: '🇳🇿',
    exampleFormat: '+64 XX XXX XXXX',
    numberLength: { min: 8, max: 10 },
  },

  // Afrika
  {
    code: 'ZA',
    dialCode: '+27',
    name: 'South Africa',
    nameTr: 'Güney Afrika',
    flag: '🇿🇦',
    exampleFormat: '+27 XX XXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'NG',
    dialCode: '+234',
    name: 'Nigeria',
    nameTr: 'Nijerya',
    flag: '🇳🇬',
    exampleFormat: '+234 XXX XXX XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'KE',
    dialCode: '+254',
    name: 'Kenya',
    nameTr: 'Kenya',
    flag: '🇰🇪',
    exampleFormat: '+254 XXX XXXXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'MA',
    dialCode: '+212',
    name: 'Morocco',
    nameTr: 'Fas',
    flag: '🇲🇦',
    exampleFormat: '+212 XXX XXXXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'TN',
    dialCode: '+216',
    name: 'Tunisia',
    nameTr: 'Tunus',
    flag: '🇹🇳',
    exampleFormat: '+216 XX XXX XXX',
    numberLength: { min: 8, max: 8 },
  },
  {
    code: 'DZ',
    dialCode: '+213',
    name: 'Algeria',
    nameTr: 'Cezayir',
    flag: '🇩🇿',
    exampleFormat: '+213 XXX XX XX XX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'LY',
    dialCode: '+218',
    name: 'Libya',
    nameTr: 'Libya',
    flag: '🇱🇾',
    exampleFormat: '+218 XX XXX XXXX',
    numberLength: { min: 9, max: 9 },
  },

  // Güney Amerika
  {
    code: 'BR',
    dialCode: '+55',
    name: 'Brazil',
    nameTr: 'Brezilya',
    flag: '🇧🇷',
    exampleFormat: '+55 XX XXXXX XXXX',
    numberLength: { min: 10, max: 11 },
  },
  {
    code: 'AR',
    dialCode: '+54',
    name: 'Argentina',
    nameTr: 'Arjantin',
    flag: '🇦🇷',
    exampleFormat: '+54 XX XXXX XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'MX',
    dialCode: '+52',
    name: 'Mexico',
    nameTr: 'Meksika',
    flag: '🇲🇽',
    exampleFormat: '+52 XX XXXX XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'CO',
    dialCode: '+57',
    name: 'Colombia',
    nameTr: 'Kolombiya',
    flag: '🇨🇴',
    exampleFormat: '+57 XXX XXX XXXX',
    numberLength: { min: 10, max: 10 },
  },
  {
    code: 'CL',
    dialCode: '+56',
    name: 'Chile',
    nameTr: 'Şili',
    flag: '🇨🇱',
    exampleFormat: '+56 X XXXX XXXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'PE',
    dialCode: '+51',
    name: 'Peru',
    nameTr: 'Peru',
    flag: '🇵🇪',
    exampleFormat: '+51 XXX XXX XXX',
    numberLength: { min: 9, max: 9 },
  },
  {
    code: 'VE',
    dialCode: '+58',
    name: 'Venezuela',
    nameTr: 'Venezuela',
    flag: '🇻🇪',
    exampleFormat: '+58 XXX XXX XXXX',
    numberLength: { min: 10, max: 10 },
  },

  // KKTC ve Kıbrıs
  {
    code: 'CY',
    dialCode: '+357',
    name: 'Cyprus',
    nameTr: 'Kıbrıs',
    flag: '🇨🇾',
    exampleFormat: '+357 XX XXXXXX',
    numberLength: { min: 8, max: 8 },
  },
  {
    code: 'NC',
    dialCode: '+90392',
    name: 'Northern Cyprus',
    nameTr: 'Kuzey Kıbrıs',
    flag: '🇹🇷',
    exampleFormat: '+90 392 XXX XX XX',
    numberLength: { min: 7, max: 7 },
  },
];

/**
 * Telefon koduna göre ülke bul
 * @param dialCode Telefon kodu (+90, +1, vb.)
 */
export const getCountryByDialCode = (dialCode: string): CountryCode | undefined => {
  // Normalize dial code
  const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;

  // Önce tam eşleşme ara
  let country = COUNTRY_CODES.find(c => c.dialCode === normalized);
  if (country) return country;

  // Daha uzun kodları kontrol et (KKTC gibi)
  if (normalized.startsWith('+90392')) {
    return COUNTRY_CODES.find(c => c.code === 'NC');
  }

  return country;
};

/**
 * Telefon numarasından ülke bilgisi çıkar
 * @param phoneNumber Telefon numarası (+905551234567)
 */
export const getCountryFromPhoneNumber = (phoneNumber: string): CountryCode | undefined => {
  if (!phoneNumber) return undefined;

  // Normalize
  const normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');

  if (!normalized.startsWith('+')) return undefined;

  // KKTC özel kontrolü
  if (normalized.startsWith('+90392')) {
    return COUNTRY_CODES.find(c => c.code === 'NC');
  }

  // En uzun eşleşen kodu bul
  let bestMatch: CountryCode | undefined;
  let bestMatchLength = 0;

  for (const country of COUNTRY_CODES) {
    if (normalized.startsWith(country.dialCode) && country.dialCode.length > bestMatchLength) {
      bestMatch = country;
      bestMatchLength = country.dialCode.length;
    }
  }

  return bestMatch;
};

/**
 * ISO ülke koduna göre ülke bul
 * @param isoCode ISO 3166-1 alpha-2 kodu (TR, US, vb.)
 */
export const getCountryByIsoCode = (isoCode: string): CountryCode | undefined => {
  return COUNTRY_CODES.find(c => c.code.toUpperCase() === isoCode.toUpperCase());
};

/**
 * Ülke adına göre ülke bul (İngilizce veya Türkçe)
 * @param name Ülke adı
 */
export const searchCountryByName = (name: string): CountryCode[] => {
  const searchTerm = name.toLowerCase();
  return COUNTRY_CODES.filter(
    c =>
      c.name.toLowerCase().includes(searchTerm) ||
      c.nameTr.toLowerCase().includes(searchTerm)
  );
};

/**
 * Telefon numarasını uluslararası formata dönüştür
 * @param phoneNumber Yerel telefon numarası
 * @param defaultCountryCode Varsayılan ülke kodu (TR gibi)
 */
export const formatToInternational = (
  phoneNumber: string,
  defaultCountryCode: string = 'TR'
): string => {
  // Tüm özel karakterleri temizle
  let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');

  // Zaten + ile başlıyorsa, sadece temizlenmiş hali döndür
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // 00 ile başlıyorsa + ile değiştir
  if (cleaned.startsWith('00')) {
    return `+${cleaned.slice(2)}`;
  }

  // 0 ile başlıyorsa, varsayılan ülke kodunu ekle
  if (cleaned.startsWith('0')) {
    const country = getCountryByIsoCode(defaultCountryCode);
    if (country) {
      return `${country.dialCode}${cleaned.slice(1)}`;
    }
  }

  // Hiçbir önek yoksa, varsayılan ülke kodunu ekle
  const country = getCountryByIsoCode(defaultCountryCode);
  if (country) {
    return `${country.dialCode}${cleaned}`;
  }

  return cleaned;
};

/**
 * Telefon numarasının hangi ülkeden olduğunu string olarak döndür
 * Arama ekranında göstermek için kullanışlı
 * @param phoneNumber Telefon numarası
 * @param language Dil (tr veya en)
 */
export const getCountryNameFromPhone = (
  phoneNumber: string,
  language: 'tr' | 'en' = 'tr'
): string | undefined => {
  const country = getCountryFromPhoneNumber(phoneNumber);
  if (!country) return undefined;
  return language === 'tr' ? country.nameTr : country.name;
};

/**
 * Telefon numarasının bayrağını döndür
 * @param phoneNumber Telefon numarası
 */
export const getFlagFromPhone = (phoneNumber: string): string | undefined => {
  const country = getCountryFromPhoneNumber(phoneNumber);
  return country?.flag;
};

// Default export
export default COUNTRY_CODES;
