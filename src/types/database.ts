export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BucketStatus = "R" | "S" | "G";
export type ReviewStatus = "scheduled" | "complete" | "partial" | "missed";
export type ThemePreference = "light" | "dark" | "system";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string;
          due_revision_reminders_enabled: boolean;
          email: string | null;
          gemini_api_key: string | null;
          missed_review_reminders_enabled: boolean;
          reminder_email_enabled: boolean;
          theme: ThemePreference;
          updated_at: string;
          user_id: string;
          weekly_retrieval_enabled: boolean;
        };
        Insert: {
          created_at?: string;
          due_revision_reminders_enabled?: boolean;
          email?: string | null;
          gemini_api_key?: string | null;
          missed_review_reminders_enabled?: boolean;
          reminder_email_enabled?: boolean;
          theme?: ThemePreference;
          updated_at?: string;
          user_id: string;
          weekly_retrieval_enabled?: boolean;
        };
        Update: {
          created_at?: string;
          due_revision_reminders_enabled?: boolean;
          email?: string | null;
          gemini_api_key?: string | null;
          missed_review_reminders_enabled?: boolean;
          reminder_email_enabled?: boolean;
          theme?: ThemePreference;
          updated_at?: string;
          user_id?: string;
          weekly_retrieval_enabled?: boolean;
        };
        Relationships: [];
      };
      class_schedule: {
        Row: {
          created_at: string;
          end_time: string;
          id: string;
          is_active: boolean;
          label: string;
          start_time: string;
          updated_at: string;
          user_id: string;
          weekday: number;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          start_time: string;
          updated_at?: string;
          user_id: string;
          weekday: number;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          start_time?: string;
          updated_at?: string;
          user_id?: string;
          weekday?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      bucket_status: BucketStatus;
      review_status: ReviewStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
export type ClassSchedule =
  Database["public"]["Tables"]["class_schedule"]["Row"];

