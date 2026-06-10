import { supabase } from "@/lib/supabase/client";
import type {
  AiConfidence,
  AiNextAction,
  BucketStatus,
  PromptType,
} from "@/types/database";

export type AiResponseEvaluation = {
  bucket_reason: string;
  bucket_suggestion: BucketStatus;
  confidence: AiConfidence;
  corrected_answer: string;
  feedback: string;
  is_correct: boolean;
  next_action: AiNextAction;
  score: number;
  what_was_good: string[];
  what_was_missing: string[];
};

type EvaluateResponseInput = {
  expectedConceptOrReferenceAnswer?: string | null;
  moduleName: string;
  questionId: string;
  questionText: string;
  questionType: PromptType;
  topicId: string;
  topicName: string;
  userAnswer: string;
  userId: string;
};

async function getFunctionErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "context" in error &&
    error.context instanceof Response
  ) {
    try {
      const payload = (await error.context.clone().json()) as {
        error?: string;
      };

      if (payload.error) {
        return payload.error;
      }
    } catch {
      // Fall back to the SDK message when the function did not return JSON.
    }
  }

  return error instanceof Error && error.message
    ? error.message
    : "Your answer could not be evaluated.";
}

export async function evaluateResponse(input: EvaluateResponseInput) {
  const { data, error } =
    await supabase.functions.invoke<AiResponseEvaluation>("evaluate-response", {
      body: {
        expected_concept_or_reference_answer:
          input.expectedConceptOrReferenceAnswer ?? null,
        module_name: input.moduleName,
        question_id: input.questionId,
        question_text: input.questionText,
        question_type: input.questionType,
        topic_id: input.topicId,
        topic_name: input.topicName,
        user_answer: input.userAnswer,
        user_id: input.userId,
      },
    });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!data) {
    throw new Error("The evaluator returned no feedback.");
  }

  return data;
}
