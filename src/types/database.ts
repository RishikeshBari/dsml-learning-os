export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BucketStatus = "R" | "S" | "G";
export type BucketSuggestionStatus = "pending" | "accepted" | "rejected";
export type AiConfidence = "low" | "medium" | "high";
export type AiNextAction =
  | "revise_again"
  | "practice_coding"
  | "move_forward"
  | "mark_for_sunday_retrieval";
export type ProjectStatus =
  | "idea"
  | "not_started"
  | "planning"
  | "in_progress"
  | "blocked"
  | "testing"
  | "deployed"
  | "completed"
  | "archived";
export type ProjectPhaseStatus =
  | "not_started"
  | "in_progress"
  | "completed";
export type ProjectPhasePriority = "low" | "medium" | "high";
export type ProjectProgressSource =
  | "phase"
  | "work_log"
  | "manual"
  | "migration";
export type PromptSource = "system" | "gemini";
export type PromptType = "conceptual" | "interview" | "practical" | "coding";
export type InterviewModuleStatus =
  | "not_started"
  | "weak"
  | "improving"
  | "interview_ready";
export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewQuestionType =
  | "conceptual"
  | "coding"
  | "scenario_based"
  | "debugging"
  | "project_based"
  | "resume_based"
  | "hr_behavioral";
export type InterviewQualityLabel =
  | "too_vague"
  | "too_theoretical"
  | "good_but_incomplete"
  | "interview_ready"
  | "needs_example"
  | "needs_code_clarity"
  | "conceptually_weak"
  | "strong_answer";
export type InterviewSessionType =
  | "normal"
  | "weak_drill"
  | "mock"
  | "project_defense"
  | "resume_based"
  | "last_7_days";
export type InterviewSessionStatus =
  | "planned"
  | "in_progress"
  | "completed";
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
          ai_bucket_reason: string | null;
          ai_bucket_suggestion: BucketStatus | null;
          ai_confidence: AiConfidence | null;
          ai_corrected_answer: string | null;
          ai_feedback: string | null;
          ai_is_correct: boolean | null;
          ai_next_action: AiNextAction | null;
          ai_score: number | null;
          ai_what_was_good: string[] | null;
          ai_what_was_missing: string[] | null;
          completed_at: string | null;
          created_at: string;
          evaluated_at: string | null;
          id: string;
          response: string | null;
          retrieval_prompt_id: string;
          score: number | null;
          score_overridden: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_bucket_reason?: string | null;
          ai_bucket_suggestion?: BucketStatus | null;
          ai_confidence?: AiConfidence | null;
          ai_corrected_answer?: string | null;
          ai_feedback?: string | null;
          ai_is_correct?: boolean | null;
          ai_next_action?: AiNextAction | null;
          ai_score?: number | null;
          ai_what_was_good?: string[] | null;
          ai_what_was_missing?: string[] | null;
          completed_at?: string | null;
          created_at?: string;
          evaluated_at?: string | null;
          id?: string;
          response?: string | null;
          retrieval_prompt_id: string;
          score?: number | null;
          score_overridden?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_bucket_reason?: string | null;
          ai_bucket_suggestion?: BucketStatus | null;
          ai_confidence?: AiConfidence | null;
          ai_corrected_answer?: string | null;
          ai_feedback?: string | null;
          ai_is_correct?: boolean | null;
          ai_next_action?: AiNextAction | null;
          ai_score?: number | null;
          ai_what_was_good?: string[] | null;
          ai_what_was_missing?: string[] | null;
          completed_at?: string | null;
          created_at?: string;
          evaluated_at?: string | null;
          id?: string;
          response?: string | null;
          retrieval_prompt_id?: string;
          score?: number | null;
          score_overridden?: boolean;
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
          demo_url: string | null;
          github_link: string | null;
          id: string;
          last_worked_on: string | null;
          module_id: string | null;
          name: string;
          next_action: string | null;
          notes: string | null;
          notes_updated_at: string | null;
          progress_percentage: number;
          started_at: string | null;
          status: ProjectStatus;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          demo_url?: string | null;
          github_link?: string | null;
          id?: string;
          last_worked_on?: string | null;
          module_id?: string | null;
          name: string;
          next_action?: string | null;
          notes?: string | null;
          notes_updated_at?: string | null;
          progress_percentage?: number;
          started_at?: string | null;
          status?: ProjectStatus;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          demo_url?: string | null;
          github_link?: string | null;
          id?: string;
          last_worked_on?: string | null;
          module_id?: string | null;
          name?: string;
          next_action?: string | null;
          notes?: string | null;
          notes_updated_at?: string | null;
          progress_percentage?: number;
          started_at?: string | null;
          status?: ProjectStatus;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      project_topics: {
        Row: {
          created_at: string;
          project_id: string;
          topic_id: string;
        };
        Insert: {
          created_at?: string;
          project_id: string;
          topic_id: string;
        };
        Update: {
          created_at?: string;
          project_id?: string;
          topic_id?: string;
        };
        Relationships: [];
      };
      project_phases: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          order_index: number;
          priority: ProjectPhasePriority;
          project_id: string;
          status: ProjectPhaseStatus;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          order_index?: number;
          priority?: ProjectPhasePriority;
          project_id: string;
          status?: ProjectPhaseStatus;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          order_index?: number;
          priority?: ProjectPhasePriority;
          project_id?: string;
          status?: ProjectPhaseStatus;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      project_work_logs: {
        Row: {
          blockers: string | null;
          created_at: string;
          id: string;
          log_date: string;
          next_step: string | null;
          phase_id: string | null;
          progress_snapshot: number;
          project_id: string;
          time_spent_minutes: number;
          updated_at: string;
          user_id: string;
          work_summary: string;
        };
        Insert: {
          blockers?: string | null;
          created_at?: string;
          id?: string;
          log_date?: string;
          next_step?: string | null;
          phase_id?: string | null;
          progress_snapshot?: number;
          project_id: string;
          time_spent_minutes: number;
          updated_at?: string;
          user_id: string;
          work_summary: string;
        };
        Update: {
          blockers?: string | null;
          created_at?: string;
          id?: string;
          log_date?: string;
          next_step?: string | null;
          phase_id?: string | null;
          progress_snapshot?: number;
          project_id?: string;
          time_spent_minutes?: number;
          updated_at?: string;
          user_id?: string;
          work_summary?: string;
        };
        Relationships: [];
      };
      project_progress_snapshots: {
        Row: {
          created_at: string;
          id: string;
          progress_percentage: number;
          project_id: string;
          recorded_at: string;
          source: ProjectProgressSource;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          progress_percentage: number;
          project_id: string;
          recorded_at?: string;
          source: ProjectProgressSource;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          progress_percentage?: number;
          project_id?: string;
          recorded_at?: string;
          source?: ProjectProgressSource;
          user_id?: string;
        };
        Relationships: [];
      };
      interview_modules: {
        Row: {
          created_at: string;
          id: string;
          learning_module_id: string | null;
          name: string;
          readiness_score: number;
          status: InterviewModuleStatus;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          learning_module_id?: string | null;
          name: string;
          readiness_score?: number;
          status?: InterviewModuleStatus;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          learning_module_id?: string | null;
          name?: string;
          readiness_score?: number;
          status?: InterviewModuleStatus;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      interview_topics: {
        Row: {
          created_at: string;
          id: string;
          last_practiced_at: string | null;
          learning_topic_id: string | null;
          module_id: string;
          name: string;
          updated_at: string;
          user_id: string;
          weakness_score: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_practiced_at?: string | null;
          learning_topic_id?: string | null;
          module_id: string;
          name: string;
          updated_at?: string;
          user_id: string;
          weakness_score?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_practiced_at?: string | null;
          learning_topic_id?: string | null;
          module_id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
          weakness_score?: number;
        };
        Relationships: [];
      };
      interview_questions: {
        Row: {
          answer_notes: string | null;
          code_snippet: string | null;
          context_source: string | null;
          created_at: string;
          difficulty: number | null;
          difficulty_label: InterviewDifficulty | null;
          expected_skills: string[];
          id: string;
          interview_module_id: string | null;
          interview_topic_id: string | null;
          item_type: "conceptual" | "technical" | "coding" | "behavioral";
          question: string;
          question_type: InterviewQuestionType | null;
          source: PromptSource;
          suggested_time_minutes: number | null;
          topic_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          answer_notes?: string | null;
          code_snippet?: string | null;
          context_source?: string | null;
          created_at?: string;
          difficulty?: number | null;
          difficulty_label?: InterviewDifficulty | null;
          expected_skills?: string[];
          id?: string;
          interview_module_id?: string | null;
          interview_topic_id?: string | null;
          item_type?: "conceptual" | "technical" | "coding" | "behavioral";
          question: string;
          question_type?: InterviewQuestionType | null;
          source?: PromptSource;
          suggested_time_minutes?: number | null;
          topic_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          answer_notes?: string | null;
          code_snippet?: string | null;
          context_source?: string | null;
          created_at?: string;
          difficulty?: number | null;
          difficulty_label?: InterviewDifficulty | null;
          expected_skills?: string[];
          id?: string;
          interview_module_id?: string | null;
          interview_topic_id?: string | null;
          item_type?: "conceptual" | "technical" | "coding" | "behavioral";
          question?: string;
          question_type?: InterviewQuestionType | null;
          source?: PromptSource;
          suggested_time_minutes?: number | null;
          topic_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      interview_attempts: {
        Row: {
          ai_score: number | null;
          answer_quality_label: InterviewQualityLabel | null;
          attempted_at: string;
          attempt_number: number;
          confidence: AiConfidence | null;
          evaluated_at: string | null;
          id: string;
          improvement_delta: number | null;
          interview_question_id: string;
          is_draft: boolean;
          notes: string | null;
          score: number | null;
          updated_at: string;
          user_answer: string | null;
          user_id: string;
        };
        Insert: {
          ai_score?: number | null;
          answer_quality_label?: InterviewQualityLabel | null;
          attempted_at?: string;
          attempt_number?: number;
          confidence?: AiConfidence | null;
          evaluated_at?: string | null;
          id?: string;
          improvement_delta?: number | null;
          interview_question_id: string;
          is_draft?: boolean;
          notes?: string | null;
          score?: number | null;
          updated_at?: string;
          user_answer?: string | null;
          user_id: string;
        };
        Update: {
          ai_score?: number | null;
          answer_quality_label?: InterviewQualityLabel | null;
          attempted_at?: string;
          attempt_number?: number;
          confidence?: AiConfidence | null;
          evaluated_at?: string | null;
          id?: string;
          improvement_delta?: number | null;
          interview_question_id?: string;
          is_draft?: boolean;
          notes?: string | null;
          score?: number | null;
          updated_at?: string;
          user_answer?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      interview_feedback: {
        Row: {
          attempt_id: string;
          code_snippet: string | null;
          common_mistakes: string[];
          correct_points: string[];
          created_at: string;
          example: string | null;
          follow_up_questions: string[];
          id: string;
          ideal_answer: string | null;
          improvement_tips: string[];
          interview_friendly_answer: string | null;
          mistakes: string[];
          missing_points: string[];
          natural_speaking_tip: string | null;
          quick_revision_summary: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempt_id: string;
          code_snippet?: string | null;
          common_mistakes?: string[];
          correct_points?: string[];
          created_at?: string;
          example?: string | null;
          follow_up_questions?: string[];
          id?: string;
          ideal_answer?: string | null;
          improvement_tips?: string[];
          interview_friendly_answer?: string | null;
          mistakes?: string[];
          missing_points?: string[];
          natural_speaking_tip?: string | null;
          quick_revision_summary?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempt_id?: string;
          code_snippet?: string | null;
          common_mistakes?: string[];
          correct_points?: string[];
          created_at?: string;
          example?: string | null;
          follow_up_questions?: string[];
          id?: string;
          ideal_answer?: string | null;
          improvement_tips?: string[];
          interview_friendly_answer?: string | null;
          mistakes?: string[];
          missing_points?: string[];
          natural_speaking_tip?: string | null;
          quick_revision_summary?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      interview_sessions: {
        Row: {
          average_score: number | null;
          completed_at: string | null;
          created_at: string;
          current_question_index: number;
          details: Json;
          id: string;
          module_id: string | null;
          question_ids: string[];
          recommendations: string[];
          session_type: InterviewSessionType;
          started_at: string | null;
          status: InterviewSessionStatus;
          strong_areas: string[];
          summary: string | null;
          updated_at: string;
          user_id: string;
          weak_areas: string[];
        };
        Insert: {
          average_score?: number | null;
          completed_at?: string | null;
          created_at?: string;
          current_question_index?: number;
          details?: Json;
          id?: string;
          module_id?: string | null;
          question_ids?: string[];
          recommendations?: string[];
          session_type: InterviewSessionType;
          started_at?: string | null;
          status?: InterviewSessionStatus;
          strong_areas?: string[];
          summary?: string | null;
          updated_at?: string;
          user_id: string;
          weak_areas?: string[];
        };
        Update: {
          average_score?: number | null;
          completed_at?: string | null;
          created_at?: string;
          current_question_index?: number;
          details?: Json;
          id?: string;
          module_id?: string | null;
          question_ids?: string[];
          recommendations?: string[];
          session_type?: InterviewSessionType;
          started_at?: string | null;
          status?: InterviewSessionStatus;
          strong_areas?: string[];
          summary?: string | null;
          updated_at?: string;
          user_id?: string;
          weak_areas?: string[];
        };
        Relationships: [];
      };
      interview_revision_notes: {
        Row: {
          created_at: string;
          id: string;
          module_id: string;
          revision_note: Json;
          topic_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          module_id: string;
          revision_note?: Json;
          topic_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          module_id?: string;
          revision_note?: Json;
          topic_id?: string | null;
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
      project_phase_priority: ProjectPhasePriority;
      project_phase_status: ProjectPhaseStatus;
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
export type ProjectTopic =
  Database["public"]["Tables"]["project_topics"]["Row"];
export type ProjectPhase =
  Database["public"]["Tables"]["project_phases"]["Row"];
export type ProjectWorkLog =
  Database["public"]["Tables"]["project_work_logs"]["Row"];
export type ProjectProgressSnapshot =
  Database["public"]["Tables"]["project_progress_snapshots"]["Row"];
export type InterviewModule =
  Database["public"]["Tables"]["interview_modules"]["Row"];
export type InterviewTopic =
  Database["public"]["Tables"]["interview_topics"]["Row"];
export type InterviewQuestion =
  Database["public"]["Tables"]["interview_questions"]["Row"];
export type InterviewAttempt =
  Database["public"]["Tables"]["interview_attempts"]["Row"];
export type InterviewFeedback =
  Database["public"]["Tables"]["interview_feedback"]["Row"];
export type InterviewSession =
  Database["public"]["Tables"]["interview_sessions"]["Row"];
export type InterviewRevisionNote =
  Database["public"]["Tables"]["interview_revision_notes"]["Row"];
export type MasterySnapshot =
  Database["public"]["Tables"]["mastery_snapshots"]["Row"];
export type BucketSuggestion =
  Database["public"]["Tables"]["bucket_suggestions"]["Row"];
