export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BucketStatus = "R" | "S" | "G";
export type BucketSuggestionStatus = "pending" | "accepted" | "rejected";
export type ProjectStatus = "not_started" | "in_progress" | "completed";
export type PromptSource = "system" | "gemini";
export type PromptType = "conceptual" | "interview" | "practical" | "coding";
export type RetrievalStatus = "planned" | "in_progress" | "complete" | "missed";
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
      modules: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_archived: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_archived?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          bucket: BucketStatus;
          created_at: string;
          date_studied: string;
          id: string;
          instructor_notes: string | null;
          is_archived: boolean;
          last_reviewed_at: string | null;
          module_id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bucket?: BucketStatus;
          created_at?: string;
          date_studied: string;
          id?: string;
          instructor_notes?: string | null;
          is_archived?: boolean;
          last_reviewed_at?: string | null;
          module_id: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bucket?: BucketStatus;
          created_at?: string;
          date_studied?: string;
          id?: string;
          instructor_notes?: string | null;
          is_archived?: boolean;
          last_reviewed_at?: string | null;
          module_id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          completed_at: string | null;
          created_at: string;
          due_date: string;
          id: string;
          mastery_score: number | null;
          review_number: number;
          status: ReviewStatus;
          topic_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          due_date: string;
          id?: string;
          mastery_score?: number | null;
          review_number: number;
          status?: ReviewStatus;
          topic_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          due_date?: string;
          id?: string;
          mastery_score?: number | null;
          review_number?: number;
          status?: ReviewStatus;
          topic_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      retrieval_sessions: {
        Row: {
          completed_at: string | null;
          created_at: string;
          duration_minutes: number;
          id: string;
          scheduled_for: string;
          status: RetrievalStatus;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          scheduled_for: string;
          status?: RetrievalStatus;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          scheduled_for?: string;
          status?: RetrievalStatus;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      retrieval_session_topics: {
        Row: {
          created_at: string;
          retrieval_session_id: string;
          selection_reason: string | null;
          topic_id: string;
        };
        Insert: {
          created_at?: string;
          retrieval_session_id: string;
          selection_reason?: string | null;
          topic_id: string;
        };
        Update: {
          created_at?: string;
          retrieval_session_id?: string;
          selection_reason?: string | null;
          topic_id?: string;
        };
        Relationships: [];
      };
      retrieval_prompts: {
        Row: {
          created_at: string;
          id: string;
          prompt: string;
          prompt_type: PromptType;
          retrieval_session_id: string | null;
          source: PromptSource;
          topic_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          prompt: string;
          prompt_type: PromptType;
          retrieval_session_id?: string | null;
          source?: PromptSource;
          topic_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          prompt?: string;
          prompt_type?: PromptType;
          retrieval_session_id?: string | null;
          source?: PromptSource;
          topic_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      retrieval_responses: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          response: string | null;
          retrieval_prompt_id: string;
          score: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          response?: string | null;
          retrieval_prompt_id: string;
          score?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          response?: string | null;
          retrieval_prompt_id?: string;
          score?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string | null;
          github_link: string | null;
          id: string;
          module_id: string | null;
          name: string;
          started_at: string | null;
          status: ProjectStatus;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          github_link?: string | null;
          id?: string;
          module_id?: string | null;
          name: string;
          started_at?: string | null;
          status?: ProjectStatus;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          github_link?: string | null;
          id?: string;
          module_id?: string | null;
          name?: string;
          started_at?: string | null;
          status?: ProjectStatus;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      mastery_snapshots: {
        Row: {
          coding_score: number;
          created_at: string;
          id: string;
          mastery_score: number;
          module_id: string | null;
          retrieval_score: number;
          revision_score: number;
          snapshot_date: string;
          topic_id: string | null;
          user_id: string;
        };
        Insert: {
          coding_score?: number;
          created_at?: string;
          id?: string;
          mastery_score?: number;
          module_id?: string | null;
          retrieval_score?: number;
          revision_score?: number;
          snapshot_date?: string;
          topic_id?: string | null;
          user_id: string;
        };
        Update: {
          coding_score?: number;
          created_at?: string;
          id?: string;
          mastery_score?: number;
          module_id?: string | null;
          retrieval_score?: number;
          revision_score?: number;
          snapshot_date?: string;
          topic_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      bucket_suggestions: {
        Row: {
          created_at: string;
          decided_at: string | null;
          from_bucket: BucketStatus;
          id: string;
          reason: string;
          status: BucketSuggestionStatus;
          to_bucket: BucketStatus;
          topic_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          decided_at?: string | null;
          from_bucket: BucketStatus;
          id?: string;
          reason: string;
          status?: BucketSuggestionStatus;
          to_bucket: BucketStatus;
          topic_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          decided_at?: string | null;
          from_bucket?: BucketStatus;
          id?: string;
          reason?: string;
          status?: BucketSuggestionStatus;
          to_bucket?: BucketStatus;
          topic_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      bucket_suggestion_status: BucketSuggestionStatus;
      bucket_status: BucketStatus;
      prompt_source: PromptSource;
      prompt_type: PromptType;
      project_status: ProjectStatus;
      retrieval_status: RetrievalStatus;
      review_status: ReviewStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
export type ClassSchedule =
  Database["public"]["Tables"]["class_schedule"]["Row"];
export type Module = Database["public"]["Tables"]["modules"]["Row"];
export type Topic = Database["public"]["Tables"]["topics"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type RetrievalSession =
  Database["public"]["Tables"]["retrieval_sessions"]["Row"];
export type RetrievalSessionTopic =
  Database["public"]["Tables"]["retrieval_session_topics"]["Row"];
export type RetrievalPrompt =
  Database["public"]["Tables"]["retrieval_prompts"]["Row"];
export type RetrievalResponse =
  Database["public"]["Tables"]["retrieval_responses"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type MasterySnapshot =
  Database["public"]["Tables"]["mastery_snapshots"]["Row"];
export type BucketSuggestion =
  Database["public"]["Tables"]["bucket_suggestions"]["Row"];
