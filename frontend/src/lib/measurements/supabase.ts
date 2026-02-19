'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) || '';
const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || '';

const throwNotConfigured = (): never => {
  throw new Error(
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env to enable save and history.'
  );
};

const stubTable = new Proxy({} as Record<string, () => never>, {
  get: () => () => throwNotConfigured(),
});

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : ({ from: () => stubTable }) as unknown as SupabaseClient;

export interface Measurement {
  id: string;
  created_at: string;
  wall_height_mm: number;
  wall_width_mm: number;
  uncertainty_mm: number;
  confidence: 'high' | 'medium' | 'low';
  charuco_markers: number;
  aruco_markers: number;
  skirting_detected: boolean;
  image_url?: string;
  technical_notes?: string;
  measurement_date: string;
}
