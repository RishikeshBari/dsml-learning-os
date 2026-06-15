import type {
  AiConfidence,
  InterviewAttempt,
  InterviewDifficulty,
  InterviewModuleStatus,
  InterviewQuestion,
  InterviewQualityLabel,
} from "@/types/database";

export const difficultyLabels: Record<InterviewDifficulty, string> = {
  easy: "Easy",
  hard: "Hard",
  medium: "Medium",
};

export const questionTypeLabels = {
  coding: "Coding",
  conceptual: "Conceptual",
  debugging: "Debugging",
  hr_behavioral: "HR / Behavioral",
  project_based: "Project-Based",
  resume_based: "Resume-Based",
  scenario_based: "Scenario-Based",
} as const;

export const qualityLabels: Record<InterviewQualityLabel, string> = {
  conceptually_weak: "Conceptually weak",
  good_but_incomplete: "Good but incomplete",
  interview_ready: "Interview-ready",
  needs_code_clarity: "Needs code clarity",
  needs_example: "Needs example",
  strong_answer: "Strong answer",
  too_theoretical: "Too theoretical",
  too_vague: "Too vague",
};

export function readinessLabel(score: number) {
  if (score <= 40) return "Not Ready";
  if (score <= 65) return "Needs Practice";
  if (score <= 80) return "Improving";
  return "Interview Ready";
}

export function moduleStatus(
  score: number,
  attemptedCount: number,
): InterviewModuleStatus {
  if (attemptedCount === 0) return "not_started";
  if (score <= 40) return "weak";
  if (score <= 80) return "improving";
  return "interview_ready";
}

type ReadinessInput = {
  attempts: InterviewAttempt[];
  questions: InterviewQuestion[];
  weakTopicCount: number;
};

const difficultyWeight: Record<InterviewDifficulty, number> = {
  easy: 0.4,
  hard: 1,
  medium: 0.7,
};

const confidenceWeight: Record<AiConfidence, number> = {
  high: 1,
  low: 0.35,
  medium: 0.7,
};

export function calculateReadiness({
  attempts,
  questions,
  weakTopicCount,
}: ReadinessInput) {
  const evaluated = attempts.filter(
    (attempt) => typeof attempt.ai_score === "number" && !attempt.is_draft,
  );

  if (evaluated.length === 0) {
    return 0;
  }

  const questionById = new Map(
    questions.map((question) => [question.id, question]),
  );
  const averageScore =
    evaluated.reduce((total, attempt) => total + (attempt.ai_score ?? 0), 0) /
    evaluated.length;
  const scoreQuality = (averageScore / 10) * 50;
  const uniqueQuestions = new Set(
    evaluated.map((attempt) => attempt.interview_question_id),
  ).size;
  const coverage = Math.min(uniqueQuestions / 12, 1) * 20;
  const difficulty =
    (evaluated.reduce((total, attempt) => {
      const label =
        questionById.get(attempt.interview_question_id)?.difficulty_label ??
        "medium";
      return total + difficultyWeight[label];
    }, 0) /
      evaluated.length) *
    10;
  const improvements = evaluated
    .map((attempt) => attempt.improvement_delta ?? 0)
    .filter((value) => value > 0);
  const improvement =
    improvements.length > 0
      ? Math.min(
          improvements.reduce((total, value) => total + value, 0) /
            improvements.length /
            3,
          1,
        ) * 10
      : 0;
  const latestAttemptTime = Math.max(
    ...evaluated.map((attempt) => new Date(attempt.attempted_at).getTime()),
  );
  const daysSincePractice =
    (Date.now() - latestAttemptTime) / (24 * 60 * 60 * 1000);
  const recency =
    daysSincePractice <= 7
      ? 10
      : daysSincePractice <= 14
        ? 7
        : daysSincePractice <= 30
          ? 4
          : 0;
  const confidence =
    (evaluated.reduce(
      (total, attempt) =>
        total +
        confidenceWeight[(attempt.confidence ?? "low") as AiConfidence],
      0,
    ) /
      evaluated.length) *
    5;
  const latestByQuestion = [...evaluated]
    .sort((first, second) =>
      second.attempted_at.localeCompare(first.attempted_at),
    )
    .filter(
      (attempt, index, collection) =>
        collection.findIndex(
          (candidate) =>
            candidate.interview_question_id ===
            attempt.interview_question_id,
        ) === index,
    );
  const repeatedStrength =
    latestByQuestion.filter((attempt) => (attempt.ai_score ?? 0) >= 8).length >=
    3
      ? 5
      : 0;
  const weakPenalty = Math.min(weakTopicCount * 2.5, 15);

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        scoreQuality +
          coverage +
          difficulty +
          improvement +
          recency +
          confidence +
          repeatedStrength -
          weakPenalty,
      ),
    ),
  );
}
