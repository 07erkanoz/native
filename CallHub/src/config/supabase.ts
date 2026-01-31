/**
 * LifeCall - Supabase Konfigürasyonu
 *
 * Supabase client kurulumu
 * .env dosyasından değerleri okur
 *
 * KULLANIM:
 * 1. .env.example dosyasını .env olarak kopyalayın
 * 2. Supabase bilgilerinizi girin
 * 3. Uygulamayı yeniden başlatın
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Config from 'react-native-config';

// Supabase URL ve Key'i .env'den al
const supabaseUrl = Config.SUPABASE_URL || '';
const supabaseAnonKey = Config.SUPABASE_ANON_KEY || '';

// Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Supabase yapılandırıldı mı kontrol et
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

/**
 * Supabase client'ı al
 * Yapılandırılmamışsa null döner
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase yapılandırılmamış. .env dosyasını kontrol edin.');
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseInstance;
};

/**
 * Supabase Database Types
 * Supabase CLI ile generate edilebilir:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
 */
export interface Database {
  public: {
    Tables: {
      spam_reports: {
        Row: {
          id: string;
          phone_number: string;
          normalized_number: string;
          category: string;
          description: string | null;
          caller_name: string | null;
          call_duration: number | null;
          reported_by: string;
          reported_at: string;
          status: 'pending' | 'verified' | 'rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['spam_reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['spam_reports']['Insert']>;
      };
      spam_numbers: {
        Row: {
          id: string;
          phone_number: string;
          normalized_number: string;
          spam_score: number;
          report_count: number;
          category: string | null;
          is_verified: boolean;
          first_reported_at: string;
          last_reported_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['spam_numbers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['spam_numbers']['Insert']>;
      };
    };
  };
}

// Typed Supabase client
export const supabase = getSupabaseClient();

export default supabase;
