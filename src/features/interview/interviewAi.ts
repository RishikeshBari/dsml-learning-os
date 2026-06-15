import { supabase } from "@/lib/supabase/client";
import type {
  AiConfidence,
  InterviewDifficulty,
  InterviewQualityLabel,
  InterviewQuestionType,
} from "@/types/database";

type CommonInput = {
  moduleId?: string;
  moduleName?: string;
  topicId?: string | null;
  topicName?: string;
  userId: string;
};

export type GeneratedInterviewQuestion = {
  code_snippet: string | null;
  expected_skills: string[];
  question_text: string;
  suggested_time_minutes: number;
};

export type InterviewEvaluation = {
  answer_quality_label: InterviewQualityLabel;
  code_snippet: string | null;
  common_mistakes: string[];
  confidence: AiConfidence;
  correct_points: string[];
  example: string | null;
  follow_up_questions: string[];
  ideal_answer: string;
  improvement_tips: string[];
  interview_friendly_answer: string;
  mistakes: string[];
  missing_points: string[];
  natural_speaking_tip: string;
  quick_revision_summary: string;
  score: number;
};

export type RevisionRecap = {
  analogy: string | null;
  common_traps: string[];
  formula_or_code: string | null;
  interview_points: string[];
  key_concept: string;
  simple_explanation: string;
  two_minute_recap: string;
};

export type MockSummary = {
  questions_to_reattempt: string[];
  recommendations: string[];
  strong_areas: string[];
  summary: string;
  weak_areas: string[];
};

export type CrashPlan = {
  days: {
    actions: string[];
    day: number;
    focus: string;
    target_minutes: number;
  }[];
  overview: string;
};

async function invokeInterviewAi<T>(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("interview-ai", {
    body,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as T;
}

export function generateInterviewQuestions(
  input: CommonInput & {
    context?: string;
    count: number;
    difficulty: InterviewDifficulty;
    questionType: InterviewQuestionType;
  },
) {
  return invokeInterviewAi<{ questions: GeneratedInterviewQuestion[] }>({
    action: "generate_questions",
    context: input.context,
    count: input.count,
    difficulty: input.difficulty,
    module_id: input.moduleId,
    module_name: input.moduleName,
    question_type: input.questionType,
    topic_id: input.topicId,
    topic_name: input.topicName,
    user_id: input.userId,
  });
}

export function evaluateInterviewAnswer(
  input: CommonInput & {
    questionId: string;
    userAnswer: string;
  },
) {
  return invokeInterviewAi<InterviewEvaluation>({
    action: "evaluate_answer",
    module_id: input.moduleId,
    module_name: input.moduleName,
    question_id: input.questionId,
    topic_id: input.topicId,
    topic_name: input.topicName,
    user_answer: input.userAnswer,
    user_id: input.userId,
  });
}

export function generateRevisionRecap(input: CommonInput) {
  return invokeInterviewAi<RevisionRecap>({
    action: "revision_recap",
    module_id: input.moduleId,
    module_name: input.moduleName,
    topic_id: input.topicId,
    topic_name: input.topicName,
    user_id: input.userId,
  });
}

export function generateMockSummary(
  input: CommonInput & {
    context: string;
    sessionId: string;
  },
) {
  return invokeInterviewAi<MockSummary>({
    action: "mock_summary",
    context: input.context,
    module_id: input.moduleId,
    module_name: input.moduleName,
    session_id: input.sessionId,
    user_id: input.userId,
  });
}

export function generateCrashPlan(input: {
  readinessContext: string;
  userId: string;
}) {
  return invokeInterviewAi<CrashPlan>({
    action: "crash_plan",
    readiness_context: input.readinessContext,
    user_id: input.userId,
  });
}
