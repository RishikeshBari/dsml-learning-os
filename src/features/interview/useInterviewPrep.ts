import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import {
  evaluateInterviewAnswer,
  generateCrashPlan,
  generateInterviewQuestions,
  generateMockSummary,
  generateRevisionRecap,
  type CrashPlan,
} from "@/features/interview/interviewAi";
import {
  calculateReadiness,
  interviewModuleNames,
  moduleStatus,
} from "@/features/interview/interviewConfig";
import { supabase } from "@/lib/supabase/client";
import type {
  InterviewAttempt,
  InterviewDifficulty,
  InterviewFeedback,
  InterviewModule,
  InterviewQuestion,
  InterviewQuestionType,
  InterviewRevisionNote,
  InterviewSession,
  InterviewSessionType,
  InterviewTopic,
  Json,
  Project,
  Topic,
} from "@/types/database";

export type InterviewAttemptWithFeedback = InterviewAttempt & {
  feedback: InterviewFeedback | null;
};

export type InterviewQuestionWithDetails = InterviewQuestion & {
  attempts: InterviewAttemptWithFeedback[];
  moduleName: string;
  topicName: string;
};

export type InterviewModuleWithStats = InterviewModule & {
  attemptedQuestionCount: number;
  averageScore: number | null;
  lastPracticedAt: string | null;
  questionCount: number;
  suggestedAction: string;
  weakTopics: string[];
};

export type InterviewPrepData = {
  attempts: InterviewAttemptWithFeedback[];
  modules: InterviewModuleWithStats[];
  projects: Project[];
  questions: InterviewQuestionWithDetails[];
  revisionNotes: InterviewRevisionNote[];
  sessions: InterviewSession[];
  sourceTopics: Topic[];
  topics: InterviewTopic[];
};

export type GenerateQuestionsInput = {
  context?: string;
  contextSource?: string;
  count: number;
  difficulty: InterviewDifficulty;
  moduleId: string;
  questionType: InterviewQuestionType;
  sessionType?: InterviewSessionType;
  topicName: string;
};

function itemTypeFor(questionType: InterviewQuestionType) {
  if (questionType === "conceptual") return "conceptual" as const;
  if (questionType === "coding" || questionType === "debugging") {
    return "coding" as const;
  }
  if (questionType === "hr_behavioral") return "behavioral" as const;
  return "technical" as const;
}

function difficultyNumber(difficulty: InterviewDifficulty) {
  if (difficulty === "easy") return 1;
  if (difficulty === "hard") return 5;
  return 3;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return (
    Math.round(
      (values.reduce((total, value) => total + value, 0) / values.length) *
        10,
    ) / 10
  );
}

function latestEvaluatedAttempts(attempts: InterviewAttempt[]) {
  return [...attempts]
    .filter(
      (attempt) => !attempt.is_draft && typeof attempt.ai_score === "number",
    )
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
}

export function useInterviewPrep() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["interview-prep", user?.id];

  const interviewQuery = useQuery<InterviewPrepData>({
    enabled: Boolean(user),
    queryKey,
    queryFn: async () => {
      if (!user) {
        throw new Error("Interview Prep requires an authenticated user.");
      }

      const modulesResult = await supabase
        .from("interview_modules")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      let moduleRows = modulesResult.data;
      const modulesError = modulesResult.error;

      if (modulesError) {
        throw modulesError;
      }

      const existingNames = new Set(
        (moduleRows ?? []).map((moduleItem) => moduleItem.name),
      );
      const missingModules = interviewModuleNames.filter(
        (name) => !existingNames.has(name),
      );

      if (missingModules.length > 0) {
        const insertResult = await supabase.from("interview_modules").insert(
          missingModules.map((name) => ({
            name,
            user_id: user.id,
          })),
        );

        if (insertResult.error) {
          throw insertResult.error;
        }

        const refreshedResult = await supabase
          .from("interview_modules")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (refreshedResult.error) {
          throw refreshedResult.error;
        }

        moduleRows = refreshedResult.data;
      }

      const [
        topicsResult,
        questionsResult,
        attemptsResult,
        feedbackResult,
        sessionsResult,
        revisionNotesResult,
        projectsResult,
        sourceTopicsResult,
      ] = await Promise.all([
        supabase
          .from("interview_topics")
          .select("*")
          .eq("user_id", user.id)
          .order("weakness_score", { ascending: false }),
        supabase
          .from("interview_questions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("interview_attempts")
          .select("*")
          .eq("user_id", user.id)
          .order("attempted_at", { ascending: false }),
        supabase
          .from("interview_feedback")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("interview_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("interview_revision_notes")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("topics")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("name", { ascending: true }),
      ]);

      const errors = [
        topicsResult.error,
        questionsResult.error,
        attemptsResult.error,
        feedbackResult.error,
        sessionsResult.error,
        revisionNotesResult.error,
        projectsResult.error,
        sourceTopicsResult.error,
      ].filter(Boolean);

      if (errors[0]) {
        throw errors[0];
      }

      const moduleOrder = new Map<string, number>(
        interviewModuleNames.map((name, index) => [name, index]),
      );
      const modules = ([...(moduleRows ?? [])] as InterviewModule[]).sort(
        (first, second) =>
          (moduleOrder.get(first.name) ?? Number.MAX_SAFE_INTEGER) -
          (moduleOrder.get(second.name) ?? Number.MAX_SAFE_INTEGER),
      );
      const topics = (topicsResult.data ?? []) as InterviewTopic[];
      const questions = (questionsResult.data ?? []) as InterviewQuestion[];
      const attempts = (attemptsResult.data ?? []) as InterviewAttempt[];
      const feedback = (feedbackResult.data ?? []) as InterviewFeedback[];
      const feedbackByAttempt = new Map(
        feedback.map((item) => [item.attempt_id, item]),
      );
      const attemptsWithFeedback = attempts.map((attempt) => ({
        ...attempt,
        feedback: feedbackByAttempt.get(attempt.id) ?? null,
      }));
      const moduleById = new Map(
        modules.map((moduleItem) => [moduleItem.id, moduleItem]),
      );
      const topicById = new Map(topics.map((topic) => [topic.id, topic]));
      const questionsWithDetails = questions.map((question) => ({
        ...question,
        attempts: attemptsWithFeedback.filter(
          (attempt) => attempt.interview_question_id === question.id,
        ),
        moduleName:
          moduleById.get(question.interview_module_id ?? "")?.name ??
          "Interview Prep",
        topicName:
          topicById.get(question.interview_topic_id ?? "")?.name ??
          "General",
      }));

      const modulesWithStats = modules.map((moduleItem) => {
        const moduleQuestions = questions.filter(
          (question) => question.interview_module_id === moduleItem.id,
        );
        const questionIds = new Set(
          moduleQuestions.map((question) => question.id),
        );
        const moduleAttempts = attempts.filter((attempt) =>
          questionIds.has(attempt.interview_question_id),
        );
        const latestAttempts = latestEvaluatedAttempts(moduleAttempts);
        const moduleTopics = topics.filter(
          (topic) => topic.module_id === moduleItem.id,
        );
        const weakTopics = moduleTopics
          .filter((topic) => topic.weakness_score >= 55)
          .sort((first, second) => second.weakness_score - first.weakness_score)
          .slice(0, 3)
          .map((topic) => topic.name);
        const readinessScore = calculateReadiness({
          attempts: moduleAttempts,
          questions: moduleQuestions,
          weakTopicCount: weakTopics.length,
        });
        const latestDate = latestAttempts
          .map((attempt) => attempt.attempted_at)
          .sort((first, second) => second.localeCompare(first))[0] ?? null;

        return {
          ...moduleItem,
          attemptedQuestionCount: latestAttempts.length,
          averageScore: average(
            latestAttempts.map((attempt) => attempt.ai_score ?? 0),
          ),
          lastPracticedAt: latestDate,
          questionCount: moduleQuestions.length,
          readiness_score: readinessScore,
          status: moduleStatus(readinessScore, latestAttempts.length),
          suggestedAction:
            weakTopics.length > 0
              ? `Drill ${weakTopics[0]} next`
              : latestAttempts.length === 0
                ? "Generate three medium questions"
                : readinessScore < 66
                  ? "Re-attempt a low-scoring answer"
                  : "Practice one hard scenario",
          weakTopics,
        };
      });

      return {
        attempts: attemptsWithFeedback,
        modules: modulesWithStats,
        projects: (projectsResult.data ?? []) as Project[],
        questions: questionsWithDetails,
        revisionNotes: (revisionNotesResult.data ??
          []) as InterviewRevisionNote[],
        sessions: (sessionsResult.data ?? []) as InterviewSession[],
        sourceTopics: (sourceTopicsResult.data ?? []) as Topic[],
        topics,
      };
    },
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["analytics", user?.id] }),
    ]);
  };

  async function getOrCreateTopic(moduleId: string, topicName: string) {
    if (!user) throw new Error("You need to be signed in.");
    const cleanName = topicName.trim() || "General";
    const existing = interviewQuery.data?.topics.find(
      (topic) =>
        topic.module_id === moduleId &&
        topic.name.toLowerCase() === cleanName.toLowerCase(),
    );

    if (existing) return existing;

    const linkedTopic = interviewQuery.data?.sourceTopics.find(
      (topic) => topic.name.toLowerCase() === cleanName.toLowerCase(),
    );
    const { data, error } = await supabase
      .from("interview_topics")
      .insert({
        learning_topic_id: linkedTopic?.id ?? null,
        module_id: moduleId,
        name: cleanName,
        user_id: user.id,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as InterviewTopic;
  }

  async function createGeneratedQuestions(values: GenerateQuestionsInput) {
    if (!user) throw new Error("You need to be signed in.");
    const moduleItem = interviewQuery.data?.modules.find(
      (candidate) => candidate.id === values.moduleId,
    );

    if (!moduleItem) throw new Error("Select an interview module.");

    const topic = await getOrCreateTopic(values.moduleId, values.topicName);
    const result = await generateInterviewQuestions({
      context: values.context,
      count: values.count,
      difficulty: values.difficulty,
      moduleId: moduleItem.id,
      moduleName: moduleItem.name,
      questionType: values.questionType,
      topicId: topic.id,
      topicName: topic.name,
      userId: user.id,
    });
    const { data, error } = await supabase
      .from("interview_questions")
      .insert(
        result.questions.map((question) => ({
          code_snippet: question.code_snippet,
          context_source: values.contextSource ?? values.sessionType ?? "normal",
          difficulty: difficultyNumber(values.difficulty),
          difficulty_label: values.difficulty,
          expected_skills: question.expected_skills,
          interview_module_id: moduleItem.id,
          interview_topic_id: topic.id,
          item_type: itemTypeFor(values.questionType),
          question: question.question_text,
          question_type: values.questionType,
          source: "gemini" as const,
          suggested_time_minutes: question.suggested_time_minutes,
          topic_id: topic.learning_topic_id,
          user_id: user.id,
        })),
      )
      .select("*");

    if (error) throw error;
    return (data ?? []) as InterviewQuestion[];
  }

  async function saveAttempt(questionId: string, answer: string) {
    if (!user) throw new Error("You need to be signed in.");
    const cleanAnswer = answer.trim();

    if (!cleanAnswer) throw new Error("Write an answer before saving.");

    const { data: existingRows, error: existingError } = await supabase
      .from("interview_attempts")
      .select("*")
      .eq("user_id", user.id)
      .eq("interview_question_id", questionId)
      .order("attempt_number", { ascending: false });

    if (existingError) throw existingError;
    const existing = (existingRows ?? []) as InterviewAttempt[];
    const draft = existing.find((attempt) => attempt.is_draft);

    if (draft) {
      const { data, error } = await supabase
        .from("interview_attempts")
        .update({
          notes: cleanAnswer,
          user_answer: cleanAnswer,
        })
        .eq("id", draft.id)
        .select("*")
        .single();

      if (error) throw error;
      return {
        attempt: data as InterviewAttempt,
        previousScore: existing.find(
          (attempt) =>
            !attempt.is_draft && typeof attempt.ai_score === "number",
        )?.ai_score ?? null,
      };
    }

    const { data, error } = await supabase
      .from("interview_attempts")
      .insert({
        attempt_number: (existing[0]?.attempt_number ?? 0) + 1,
        interview_question_id: questionId,
        is_draft: true,
        notes: cleanAnswer,
        user_answer: cleanAnswer,
        user_id: user.id,
      })
      .select("*")
      .single();

    if (error) throw error;
    return {
      attempt: data as InterviewAttempt,
      previousScore: existing.find(
        (attempt) =>
          !attempt.is_draft && typeof attempt.ai_score === "number",
      )?.ai_score ?? null,
    };
  }

  async function recalculateModule(moduleId: string) {
    const questionsResult = await supabase
      .from("interview_questions")
      .select("*")
      .eq("interview_module_id", moduleId);

    if (questionsResult.error) throw questionsResult.error;
    const questions = (questionsResult.data ?? []) as InterviewQuestion[];
    const questionIds = questions.map((question) => question.id);
    let attempts: InterviewAttempt[] = [];

    if (questionIds.length > 0) {
      const attemptsResult = await supabase
        .from("interview_attempts")
        .select("*")
        .in("interview_question_id", questionIds);

      if (attemptsResult.error) throw attemptsResult.error;
      attempts = (attemptsResult.data ?? []) as InterviewAttempt[];
    }

    const topicsResult = await supabase
      .from("interview_topics")
      .select("*")
      .eq("module_id", moduleId);

    if (topicsResult.error) throw topicsResult.error;
    const weakCount = ((topicsResult.data ?? []) as InterviewTopic[]).filter(
      (topic) => topic.weakness_score >= 55,
    ).length;
    const score = calculateReadiness({
      attempts,
      questions,
      weakTopicCount: weakCount,
    });
    const attemptedCount = latestEvaluatedAttempts(attempts).length;
    const updateResult = await supabase
      .from("interview_modules")
      .update({
        readiness_score: score,
        status: moduleStatus(score, attemptedCount),
      })
      .eq("id", moduleId);

    if (updateResult.error) throw updateResult.error;
  }

  const generateQuestions = useMutation({
    meta: { successMessage: "Interview questions generated" },
    mutationFn: createGeneratedQuestions,
    onSuccess: invalidate,
  });

  const saveAnswer = useMutation({
    meta: { successMessage: "Answer saved as a draft" },
    mutationFn: async ({
      answer,
      questionId,
    }: {
      answer: string;
      questionId: string;
    }) => saveAttempt(questionId, answer),
    onSuccess: invalidate,
  });

  const evaluateAnswer = useMutation({
    meta: { successMessage: "Interview answer evaluated" },
    mutationFn: async ({
      answer,
      questionId,
    }: {
      answer: string;
      questionId: string;
    }) => {
      if (!user) throw new Error("You need to be signed in.");
      const question = interviewQuery.data?.questions.find(
        (candidate) => candidate.id === questionId,
      );

      if (!question || !question.interview_module_id) {
        throw new Error("Interview question could not be found.");
      }

      const { attempt, previousScore } = await saveAttempt(questionId, answer);
      const evaluation = await evaluateInterviewAnswer({
        moduleId: question.interview_module_id,
        moduleName: question.moduleName,
        questionId,
        topicId: question.interview_topic_id,
        topicName: question.topicName,
        userAnswer: answer.trim(),
        userId: user.id,
      });
      const improvementDelta =
        previousScore === null ? null : evaluation.score - previousScore;
      const attemptResult = await supabase
        .from("interview_attempts")
        .update({
          ai_score: evaluation.score,
          answer_quality_label: evaluation.answer_quality_label,
          confidence: evaluation.confidence,
          evaluated_at: new Date().toISOString(),
          improvement_delta: improvementDelta,
          is_draft: false,
          score: Math.round(evaluation.score / 2),
        })
        .eq("id", attempt.id);

      if (attemptResult.error) throw attemptResult.error;

      const feedbackResult = await supabase.from("interview_feedback").upsert(
        {
          attempt_id: attempt.id,
          code_snippet: evaluation.code_snippet,
          common_mistakes: evaluation.common_mistakes,
          correct_points: evaluation.correct_points,
          example: evaluation.example,
          follow_up_questions: evaluation.follow_up_questions,
          ideal_answer: evaluation.ideal_answer,
          improvement_tips: evaluation.improvement_tips,
          interview_friendly_answer: evaluation.interview_friendly_answer,
          mistakes: evaluation.mistakes,
          missing_points: evaluation.missing_points,
          natural_speaking_tip: evaluation.natural_speaking_tip,
          quick_revision_summary: evaluation.quick_revision_summary,
          user_id: user.id,
        },
        { onConflict: "attempt_id" },
      );

      if (feedbackResult.error) throw feedbackResult.error;

      if (question.interview_topic_id) {
        const topicResult = await supabase
          .from("interview_topics")
          .update({
            last_practiced_at: new Date().toISOString(),
            weakness_score: Math.max(
              0,
              Math.min(100, Math.round(100 - evaluation.score * 10)),
            ),
          })
          .eq("id", question.interview_topic_id);

        if (topicResult.error) throw topicResult.error;
      }

      await recalculateModule(question.interview_module_id);
      return evaluation;
    },
    onSuccess: invalidate,
  });

  const createRevision = useMutation({
    meta: { successMessage: "Two-minute revision recap ready" },
    mutationFn: async (questionId: string) => {
      if (!user) throw new Error("You need to be signed in.");
      const question = interviewQuery.data?.questions.find(
        (candidate) => candidate.id === questionId,
      );

      if (!question?.interview_module_id) {
        throw new Error("Interview question could not be found.");
      }

      const recap = await generateRevisionRecap({
        moduleId: question.interview_module_id,
        moduleName: question.moduleName,
        topicId: question.interview_topic_id,
        topicName: question.topicName,
        userId: user.id,
      });
      const existing = interviewQuery.data?.revisionNotes.find(
        (note) =>
          note.module_id === question.interview_module_id &&
          note.topic_id === question.interview_topic_id,
      );
      const payload = {
        module_id: question.interview_module_id,
        revision_note: recap as unknown as Json,
        topic_id: question.interview_topic_id,
        user_id: user.id,
      };
      const result = existing
        ? await supabase
            .from("interview_revision_notes")
            .update({ revision_note: payload.revision_note })
            .eq("id", existing.id)
        : await supabase.from("interview_revision_notes").insert(payload);

      if (result.error) throw result.error;
      return recap;
    },
    onSuccess: invalidate,
  });

  const startMock = useMutation({
    meta: { successMessage: "Mock interview started" },
    mutationFn: async ({
      count,
      moduleId,
    }: {
      count: number;
      moduleId: string;
    }) => {
      if (!user) throw new Error("You need to be signed in.");
      const questions = await createGeneratedQuestions({
        contextSource: "mock",
        count,
        difficulty: "medium",
        moduleId,
        questionType: "scenario_based",
        sessionType: "mock",
        topicName: "Mixed mock interview",
      });
      const { data, error } = await supabase
        .from("interview_sessions")
        .insert({
          current_question_index: 0,
          module_id: moduleId,
          question_ids: questions.map((question) => question.id),
          session_type: "mock",
          started_at: new Date().toISOString(),
          status: "in_progress",
          user_id: user.id,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data as InterviewSession;
    },
    onSuccess: invalidate,
  });

  const updateSessionIndex = useMutation({
    mutationFn: async ({
      index,
      sessionId,
    }: {
      index: number;
      sessionId: string;
    }) => {
      const { error } = await supabase
        .from("interview_sessions")
        .update({ current_question_index: index })
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const completeMock = useMutation({
    meta: { successMessage: "Mock interview completed" },
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error("You need to be signed in.");
      const session = interviewQuery.data?.sessions.find(
        (candidate) => candidate.id === sessionId,
      );

      if (!session) throw new Error("Mock interview could not be found.");

      const sessionQuestions = interviewQuery.data?.questions.filter(
        (question) => session.question_ids.includes(question.id),
      ) ?? [];
      const rows = sessionQuestions.map((question) => {
        const latest = latestEvaluatedAttempts(question.attempts)[0];
        return `Question: ${question.question}\nScore: ${
          latest?.ai_score ?? "Not answered"
        }\nAnswer: ${latest?.user_answer ?? "No answer"}`;
      });
      const moduleItem = interviewQuery.data?.modules.find(
        (candidate) => candidate.id === session.module_id,
      );
      const summary = await generateMockSummary({
        context: rows.join("\n\n").slice(0, 16_000),
        moduleId: session.module_id ?? undefined,
        moduleName: moduleItem?.name,
        sessionId,
        userId: user.id,
      });
      const scores = sessionQuestions
        .flatMap((question) => latestEvaluatedAttempts(question.attempts))
        .map((attempt) => attempt.ai_score ?? 0);
      const { error } = await supabase
        .from("interview_sessions")
        .update({
          average_score: average(scores),
          completed_at: new Date().toISOString(),
          recommendations: summary.recommendations,
          status: "completed",
          strong_areas: summary.strong_areas,
          summary: summary.summary,
          weak_areas: summary.weak_areas,
        })
        .eq("id", sessionId);

      if (error) throw error;
      return summary;
    },
    onSuccess: invalidate,
  });

  const createCrashPlan = useMutation({
    meta: { successMessage: "Seven-day interview plan generated" },
    mutationFn: async () => {
      if (!user) throw new Error("You need to be signed in.");
      const context =
        interviewQuery.data?.modules
          .map(
            (moduleItem) =>
              `${moduleItem.name}: readiness ${moduleItem.readiness_score}%, average ${
                moduleItem.averageScore ?? "not started"
              }/10, weak topics ${moduleItem.weakTopics.join(", ") || "none"}`,
          )
          .join("\n") ?? "No interview history yet.";
      const plan = await generateCrashPlan({
        readinessContext: context,
        userId: user.id,
      });
      const { error } = await supabase.from("interview_sessions").insert({
        completed_at: new Date().toISOString(),
        details: plan as unknown as Json,
        recommendations: plan.days.map(
          (day) => `Day ${day.day}: ${day.focus}`,
        ),
        session_type: "last_7_days",
        status: "completed",
        summary: plan.overview,
        user_id: user.id,
      });

      if (error) throw error;
      return plan;
    },
    onSuccess: invalidate,
  });

  const mutations = [
    generateQuestions,
    saveAnswer,
    evaluateAnswer,
    createRevision,
    startMock,
    updateSessionIndex,
    completeMock,
    createCrashPlan,
  ];

  return {
    completeMock,
    createCrashPlan,
    createRevision,
    data: interviewQuery.data,
    error: interviewQuery.error,
    evaluateAnswer,
    generateQuestions,
    isLoading: interviewQuery.isLoading,
    isMutating: mutations.some((mutation) => mutation.isPending),
    mutationError: mutations.find((mutation) => mutation.error)?.error ?? null,
    saveAnswer,
    startMock,
    updateSessionIndex,
  };
}

export function getStoredCrashPlan(
  sessions: InterviewSession[],
): CrashPlan | null {
  const session = sessions.find(
    (candidate) => candidate.session_type === "last_7_days",
  );

  if (!session?.details || Array.isArray(session.details)) return null;
  const value = session.details as Record<string, Json | undefined>;

  if (!Array.isArray(value.days) || typeof value.overview !== "string") {
    return null;
  }

  return session.details as unknown as CrashPlan;
}
