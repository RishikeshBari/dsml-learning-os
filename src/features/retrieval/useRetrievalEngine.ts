import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/useAuth";
import { generateGeminiText } from "@/features/gemini/geminiClient";
import { supabase } from "@/lib/supabase/client";
import type {
  BucketStatus,
  Module,
  PromptType,
  RetrievalPrompt,
  RetrievalResponse,
  RetrievalSession,
  RetrievalSessionTopic,
  RetrievalStatus,
  Topic,
} from "@/types/database";

type RetrievalTopic = Topic & {
  moduleName: string;
};

export type PromptWithResponse = RetrievalPrompt & {
  moduleName: string;
  response: RetrievalResponse | null;
  topicBucket: BucketStatus;
  topicName: string;
};

export type SessionWithDetails = RetrievalSession & {
  averageScore: number | null;
  completedResponseCount: number;
  promptCount: number;
  prompts: PromptWithResponse[];
  topicCount: number;
  topics: RetrievalTopic[];
};

type RetrievalData = {
  candidateTopics: RetrievalTopic[];
  nextSunday: string;
  sessions: SessionWithDetails[];
};

type CreateSessionInput = {
  durationMinutes: number;
  scheduledFor: string;
};

type SaveResponseInput = {
  promptId: string;
  response: string;
  responseId?: string;
  score: number;
};

type GenerateGeminiPromptsInput = {
  apiKey: string;
  sessionId: string;
};

type GeminiPromptItem = {
  prompt: string;
  prompt_type: PromptType;
};

const promptTypes: PromptType[] = [
  "conceptual",
  "interview",
  "practical",
  "coding",
];

const geminiPromptSchema = {
  items: {
    properties: {
      prompt: {
        type: "string",
      },
      prompt_type: {
        enum: promptTypes,
        type: "string",
      },
    },
    required: ["prompt_type", "prompt"],
    type: "object",
  },
  maxItems: 4,
  minItems: 4,
  type: "array",
};

const bucketWeight: Record<BucketStatus, number> = {
  G: 2,
  R: 0,
  S: 1,
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextSunday() {
  const date = new Date();
  const day = date.getDay();
  const offset = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + offset);

  return formatDate(date);
}

function getTopicPrompt(topic: RetrievalTopic, promptType: PromptType) {
  const moduleContext = topic.moduleName ? ` from ${topic.moduleName}` : "";

  if (promptType === "conceptual") {
    return `Explain ${topic.name}${moduleContext} from memory, including the core idea, assumptions, and one common mistake.`;
  }

  if (promptType === "interview") {
    return `Answer this interview-style question: how would you recognize when ${topic.name} is the right tool, and when it is not?`;
  }

  if (promptType === "practical") {
    return `Describe a DS/ML use case where ${topic.name} matters. Include the input, method, output, and how you would validate it.`;
  }

  return `Write pseudocode or Python-like steps that demonstrate ${topic.name}. Focus on the algorithm or workflow, not syntax perfection.`;
}

function getCandidateTopics(topics: RetrievalTopic[]) {
  return [...topics]
    .sort((first, second) => {
      const bucketDelta = bucketWeight[first.bucket] - bucketWeight[second.bucket];

      if (bucketDelta !== 0) {
        return bucketDelta;
      }

      return second.created_at.localeCompare(first.created_at);
    })
    .slice(0, 3);
}

function getSessionScore(prompts: PromptWithResponse[]) {
  const scores = prompts
    .map((prompt) => prompt.response?.score)
    .filter((score): score is number => typeof score === "number");

  if (scores.length === 0) {
    return null;
  }

  return Math.round(
    (scores.reduce((total, score) => total + score, 0) / scores.length) * 10,
  ) / 10;
}

function isPromptType(value: unknown): value is PromptType {
  return (
    typeof value === "string" && promptTypes.includes(value as PromptType)
  );
}

function parseGeminiPromptItems(text: string): GeminiPromptItem[] {
  const trimmedText = text.trim();
  const jsonStart = trimmedText.indexOf("[");
  const jsonEnd = trimmedText.lastIndexOf("]");
  const jsonText =
    jsonStart >= 0 && jsonEnd > jsonStart
      ? trimmedText.slice(jsonStart, jsonEnd + 1)
      : trimmedText;

  try {
    const parsed = JSON.parse(jsonText) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (
          !item ||
          typeof item !== "object" ||
          !("prompt" in item) ||
          !("prompt_type" in item)
        ) {
          return null;
        }

        const prompt = item.prompt;
        const promptType = item.prompt_type;

        if (typeof prompt !== "string" || !isPromptType(promptType)) {
          return null;
        }

        return {
          prompt: prompt.trim(),
          prompt_type: promptType,
        };
      })
      .filter((item): item is GeminiPromptItem =>
        Boolean(item?.prompt.trim()),
      );
  } catch {
    return [];
  }
}

function buildGeminiPromptRequest(topic: RetrievalTopic) {
  const notes = topic.instructor_notes?.trim()
    ? ` Notes: ${topic.instructor_notes.trim().slice(0, 300)}`
    : "";

  return `Create four short retrieval questions about ${topic.name} in ${topic.moduleName}: conceptual, interview, practical, and coding.${notes}`;
}

export function useRetrievalEngine() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["retrieval-engine", user?.id];

  const retrievalQuery = useQuery<RetrievalData>({
    enabled: Boolean(user),
    queryKey,
    queryFn: async () => {
      if (!user) {
        throw new Error("Retrieval data requires an authenticated user.");
      }

      const [modulesResult, topicsResult, sessionsResult] = await Promise.all([
        supabase
          .from("modules")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false),
        supabase
          .from("topics")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("retrieval_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("scheduled_for", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const errors = [
        modulesResult.error,
        topicsResult.error,
        sessionsResult.error,
      ].filter(Boolean);

      if (errors[0]) {
        throw errors[0];
      }

      const modules = (modulesResult.data ?? []) as Module[];
      const topics = (topicsResult.data ?? []) as Topic[];
      const sessions = (sessionsResult.data ?? []) as RetrievalSession[];
      const moduleById = new Map(
        modules.map((moduleItem) => [moduleItem.id, moduleItem]),
      );
      const topicsWithModules = topics.map((topic) => ({
        ...topic,
        moduleName: moduleById.get(topic.module_id)?.name ?? "Module",
      }));
      const topicById = new Map(
        topicsWithModules.map((topic) => [topic.id, topic]),
      );
      const sessionIds = sessions.map((session) => session.id);

      if (sessionIds.length === 0) {
        return {
          candidateTopics: getCandidateTopics(topicsWithModules),
          nextSunday: getNextSunday(),
          sessions: [],
        };
      }

      const [sessionTopicsResult, promptsResult] = await Promise.all([
        supabase
          .from("retrieval_session_topics")
          .select("*")
          .in("retrieval_session_id", sessionIds),
        supabase
          .from("retrieval_prompts")
          .select("*")
          .in("retrieval_session_id", sessionIds)
          .order("created_at", { ascending: true }),
      ]);

      if (sessionTopicsResult.error) {
        throw sessionTopicsResult.error;
      }

      if (promptsResult.error) {
        throw promptsResult.error;
      }

      const sessionTopics =
        (sessionTopicsResult.data ?? []) as RetrievalSessionTopic[];
      const prompts = (promptsResult.data ?? []) as RetrievalPrompt[];
      const promptIds = prompts.map((prompt) => prompt.id);
      let responses: RetrievalResponse[] = [];

      if (promptIds.length > 0) {
        const responsesResult = await supabase
          .from("retrieval_responses")
          .select("*")
          .eq("user_id", user.id)
          .in("retrieval_prompt_id", promptIds);

        if (responsesResult.error) {
          throw responsesResult.error;
        }

        responses = (responsesResult.data ?? []) as RetrievalResponse[];
      }

      const responsesByPromptId = new Map(
        responses.map((response) => [response.retrieval_prompt_id, response]),
      );
      const sessionTopicsBySessionId = new Map<string, RetrievalTopic[]>();
      const promptsBySessionId = new Map<string, PromptWithResponse[]>();

      for (const sessionTopic of sessionTopics) {
        const topic = topicById.get(sessionTopic.topic_id);

        if (!topic) {
          continue;
        }

        sessionTopicsBySessionId.set(sessionTopic.retrieval_session_id, [
          ...(sessionTopicsBySessionId.get(sessionTopic.retrieval_session_id) ??
            []),
          topic,
        ]);
      }

      for (const prompt of prompts) {
        const topic = topicById.get(prompt.topic_id);

        if (!topic || !prompt.retrieval_session_id) {
          continue;
        }

        promptsBySessionId.set(prompt.retrieval_session_id, [
          ...(promptsBySessionId.get(prompt.retrieval_session_id) ?? []),
          {
            ...prompt,
            moduleName: topic.moduleName,
            response: responsesByPromptId.get(prompt.id) ?? null,
            topicBucket: topic.bucket,
            topicName: topic.name,
          },
        ]);
      }

      return {
        candidateTopics: getCandidateTopics(topicsWithModules),
        nextSunday: getNextSunday(),
        sessions: sessions.map((session) => {
          const sessionPrompts = promptsBySessionId.get(session.id) ?? [];
          const sessionTopicList = sessionTopicsBySessionId.get(session.id) ?? [];
          const completedResponseCount = sessionPrompts.filter(
            (prompt) => prompt.response?.completed_at,
          ).length;

          return {
            ...session,
            averageScore: getSessionScore(sessionPrompts),
            completedResponseCount,
            promptCount: sessionPrompts.length,
            prompts: sessionPrompts,
            topicCount: sessionTopicList.length,
            topics: sessionTopicList,
          };
        }),
      };
    },
  });

  const invalidateRetrievalData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["analytics", user?.id] }),
    ]);
  };

  const createSession = useMutation({
    mutationFn: async (values: CreateSessionInput) => {
      if (!user) {
        throw new Error("You need to be signed in to create retrieval sessions.");
      }

      const topics = getCandidateTopics(retrievalQuery.data?.candidateTopics ?? []);

      if (topics.length === 0) {
        throw new Error("Add at least one active topic before retrieval practice.");
      }

      const sessionResult = await supabase
        .from("retrieval_sessions")
        .insert({
          duration_minutes: values.durationMinutes,
          scheduled_for: values.scheduledFor,
          status: "planned",
          user_id: user.id,
        })
        .select("*")
        .single();

      if (sessionResult.error) {
        throw sessionResult.error;
      }

      const session = sessionResult.data as RetrievalSession;
      const sessionTopics = topics.map((topic) => ({
        retrieval_session_id: session.id,
        selection_reason:
          topic.bucket === "G"
            ? "Included as a stabilizing green topic."
            : `${topic.bucket} bucket priority for retrieval practice.`,
        topic_id: topic.id,
      }));
      const prompts = topics.flatMap((topic) =>
        promptTypes.map((promptType) => ({
          prompt: getTopicPrompt(topic, promptType),
          prompt_type: promptType,
          retrieval_session_id: session.id,
          source: "system" as const,
          topic_id: topic.id,
          user_id: user.id,
        })),
      );

      const [sessionTopicsResult, promptsResult] = await Promise.all([
        supabase.from("retrieval_session_topics").insert(sessionTopics),
        supabase.from("retrieval_prompts").insert(prompts),
      ]);

      if (sessionTopicsResult.error) {
        throw sessionTopicsResult.error;
      }

      if (promptsResult.error) {
        throw promptsResult.error;
      }

      return session;
    },
    onSuccess: invalidateRetrievalData,
  });

  const updateSessionStatus = useMutation({
    mutationFn: async ({
      sessionId,
      status,
    }: {
      sessionId: string;
      status: RetrievalStatus;
    }) => {
      const { error } = await supabase
        .from("retrieval_sessions")
        .update({
          completed_at: status === "complete" ? new Date().toISOString() : null,
          status,
        })
        .eq("id", sessionId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateRetrievalData,
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("retrieval_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateRetrievalData,
  });

  const saveResponse = useMutation({
    mutationFn: async (values: SaveResponseInput) => {
      if (!user) {
        throw new Error("You need to be signed in to save retrieval responses.");
      }

      const payload = {
        completed_at: new Date().toISOString(),
        response: values.response.trim(),
        score: values.score,
        user_id: user.id,
      };

      if (values.responseId) {
        const { error } = await supabase
          .from("retrieval_responses")
          .update(payload)
          .eq("id", values.responseId);

        if (error) {
          throw error;
        }

        return;
      }

      const { error } = await supabase.from("retrieval_responses").insert({
        ...payload,
        retrieval_prompt_id: values.promptId,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidateRetrievalData,
  });

  const generateGeminiPrompts = useMutation({
    mutationFn: async (values: GenerateGeminiPromptsInput) => {
      if (!user) {
        throw new Error("You need to be signed in to generate Gemini prompts.");
      }

      const apiKey = values.apiKey.trim();

      if (!apiKey) {
        throw new Error("Save a Gemini API key in Settings first.");
      }

      const session = retrievalQuery.data?.sessions.find(
        (item) => item.id === values.sessionId,
      );

      if (!session) {
        throw new Error("Select a retrieval session first.");
      }

      const existingGeminiPrompts = new Set(
        session.prompts
          .filter((prompt) => prompt.source === "gemini")
          .map((prompt) => `${prompt.topic_id}:${prompt.prompt_type}`),
      );
      const promptRows = [];

      for (const topic of session.topics) {
        const result = await generateGeminiText({
          apiKey,
          maxOutputTokens: 700,
          prompt: buildGeminiPromptRequest(topic),
          responseJsonSchema: geminiPromptSchema,
          responseMimeType: "application/json",
          timeoutMs: 60000,
        });
        const items = parseGeminiPromptItems(result);

        for (const item of items) {
          const dedupeKey = `${topic.id}:${item.prompt_type}`;

          if (existingGeminiPrompts.has(dedupeKey)) {
            continue;
          }

          existingGeminiPrompts.add(dedupeKey);
          promptRows.push({
            prompt: item.prompt,
            prompt_type: item.prompt_type,
            retrieval_session_id: session.id,
            source: "gemini" as const,
            topic_id: topic.id,
            user_id: user.id,
          });
        }
      }

      if (promptRows.length === 0) {
        throw new Error("Gemini did not return any new prompts.");
      }

      const { error } = await supabase
        .from("retrieval_prompts")
        .insert(promptRows);

      if (error) {
        throw error;
      }

      return promptRows.length;
    },
    onSuccess: invalidateRetrievalData,
  });

  return {
    createSession,
    data: retrievalQuery.data,
    deleteSession,
    error: retrievalQuery.error,
    isLoading: retrievalQuery.isLoading,
    isMutating:
      createSession.isPending ||
      updateSessionStatus.isPending ||
      deleteSession.isPending ||
      saveResponse.isPending ||
      generateGeminiPrompts.isPending,
    mutationError:
      createSession.error ??
      updateSessionStatus.error ??
      deleteSession.error ??
      saveResponse.error ??
      generateGeminiPrompts.error,
    generateGeminiPrompts,
    saveResponse,
    updateSessionStatus,
  };
}
