export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type BucketStatus = 'R' | 'S' | 'G';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          email: string | null;
          theme: ThemePreference;
          gemini_api_key: string | null;
          reminder_email_enabled: boolean;
          weekly_retrieval_enabled: boolean;
          due_revision_reminders_enabled: boolean;
          missed_review_reminders_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          theme?: ThemePreference;
          gemini_api_key?: string | null;
          reminder_email_enabled?: boolean;
          weekly_retrieval_enabled?: boolean;
          due_revision_reminders_enabled?: boolean;
          missed_review_reminders_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          theme?: ThemePreference;
          gemini_api_key?: string | null;
          reminder_email_enabled?: boolean;
          weekly_retrieval_enabled?: boolean;
          due_revision_reminders_enabled?: boolean;
          missed_review_reminders_enabled?: boolean;
          updated_at?: string;
        };
      };
      class_schedule: {
        Row: {
          id: string;
          user_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          label: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      bucket_status: BucketStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type ClassSchedule = Database['public']['Tables']['class_schedule']['Row'];
