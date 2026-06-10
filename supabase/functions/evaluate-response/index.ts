import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type QuestionType = "conceptual" | "interview" | "coding" | "practical";
type Confidence = "low" | "medium" | "high";
type NextAction =
  | "revise_again"
  | "practice_coding"
  | "move_forward"
  | "mark_for_sunday_retrieval";
type Bucket = "R" | "S" | "G";

type EvaluationInput = {
  user_id: string;
  topic_id: string;
  question_id: string;
  module_name: string;
  topic_name: string;
  question_text: string;
  expected_concept_or_reference_answer?: string | null;
  user_answer: string;
  question_type: QuestionType;
};

type GeminiEvaluation = {
  score: number;
  is_correct: boolean;
  confidence: Confidence;
  feedback: string;
  what_was_good: string[];
  what_was_missing: string[];
  corrected_answer: string;
  next_action: NextAction;
  bucket_suggestion: Bucket;
  bucket_reason: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

const questionTypes = new Set<QuestionType>([
  "conceptual",
  "interview",
  "coding",
  "practical",
]);
const confidenceValues = new Set<Confidence>(["low", "medium", "high"]);
const nextActions = new Set<NextAction>([
  "revise_again",
  "practice_coding",
  "move_forward",
  "mark_for_sunday_retrieval",
]);
const geminiEndpoint =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";
const retryableGeminiStatuses = new Set([429, 500, 502, 503]);

const evaluationSchema = {
  type: "object",
  properties: {
    score: {
      type: "integer",
      minimum: 0,
      maximum: 5,
    },
    is_correct: {
      type: "boolean",
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    feedback: {
      type: "string",
    },
    what_was_good: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    what_was_missing: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    corrected_answer: {
      type: "string",
    },
    next_action: {
      type: "string",
      enum: [
        "revise_again",
        "practice_coding",
        "move_forward",
        "mark_for_sunday_retrieval",
      ],
    },
    bucket_suggestion: {
      type: "string",
      enum: ["R", "S", "G"],
    },
    bucket_reason: {
      type: "string",
    },
  },
  required: [
    "score",
    "is_correct",
    "confidence",
    "feedback",
    "what_was_good",
    "what_was_missing",
    "corrected_answer",
    "next_action",
    "bucket_suggestion",
    "bucket_reason",
  ],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: corsHeaders,
    status,
  });
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function cleanList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function getBucketSuggestion(score: number, confidence: Confidence): Bucket {
  if (score <= 2) {
    return "R";
  }

  if (score === 3) {
    return "S";
  }

  if (score === 4) {
    return confidence === "high" ? "G" : "S";
  }

  return "G";
}

function normalizeEvaluation(value: unknown): GeminiEvaluation {
  if (!value || typeof value !== "object") {
    throw new Error("Gemini returned an invalid evaluation.");
  }

  const result = value as Record<string, unknown>;
  const rawScore =
    typeof result.score === "number" && Number.isFinite(result.score)
      ? result.score
      : 0;
  const score = Math.max(0, Math.min(5, Math.round(rawScore)));
  const confidence = confidenceValues.has(result.confidence as Confidence)
    ? (result.confidence as Confidence)
    : "low";
  const nextAction = nextActions.has(result.next_action as NextAction)
    ? (result.next_action as NextAction)
    : score <= 2
      ? "revise_again"
      : score === 3
        ? "mark_for_sunday_retrieval"
        : "move_forward";
  const bucketSuggestion = getBucketSuggestion(score, confidence);

  return {
    score,
    is_correct:
      typeof result.is_correct === "boolean"
        ? result.is_correct
        : score >= 3,
    confidence,
    feedback:
      cleanText(result.feedback, 700) ||
      "Keep going. Review the corrected answer and try once more.",
    what_was_good: cleanList(result.what_was_good),
    what_was_missing: cleanList(result.what_was_missing),
    corrected_answer: cleanText(result.corrected_answer, 3000),
    next_action: nextAction,
    bucket_suggestion: bucketSuggestion,
    bucket_reason:
      cleanText(result.bucket_reason, 400) ||
      `A score of ${score} suggests the ${bucketSuggestion} bucket.`,
  };
}

function buildEvaluationPrompt(input: EvaluationInput) {
  const referenceAnswer = cleanText(
    input.expected_concept_or_reference_answer,
    4000,
  );

  return `Evaluate this response as a supportive DS/ML mentor.

Module: ${cleanText(input.module_name, 200)}
Topic: ${cleanText(input.topic_name, 200)}
Question type: ${input.question_type}
Question: ${cleanText(input.question_text, 4000)}
Reference answer, if available: ${referenceAnswer || "Not provided"}
Learner answer: ${cleanText(input.user_answer, 12000)}

Be gentle and fair. Reward correct understanding, partial reasoning, practical
intuition, and honest attempts. Do not require textbook wording. Never lower a
score merely because an answer is short: check the core idea first. A short
correct answer can score 4, and a short, correct, clear answer can score 5.
Penalize serious conceptual errors, missing core ideas, wrong implementation
logic, or hallucinated claims. Directionally correct but incomplete answers
should receive a middle score. Mostly correct answers with small gaps should
usually receive 4.

Scoring:
0 = no meaningful answer, blank, or completely wrong
1 = very weak with major misunderstanding
2 = some relevant points but mostly incomplete or confused
3 = partially correct with basic understanding and important gaps
4 = mostly correct with minor gaps or small mistakes
5 = strong, accurate, clear, usable, and interview-ready

Bucket rules:
- score 0-2: R
- score 3: S
- score 4: S or G depending on confidence
- score 5: G

Return only JSON matching the provided schema.`;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestGemini(apiKey: string, input: EvaluationInput) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(geminiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildEvaluationPrompt(input) }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1200,
          responseJsonSchema: evaluationSchema,
          responseMimeType: "application/json",
          temperature: 0.25,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });
    const payload = await response.json();

    if (response.ok) {
      return payload;
    }

    const message =
      payload?.error?.message ?? "Gemini evaluation request failed.";
    console.error(
      JSON.stringify({
        attempt,
        message,
        status: response.status,
      }),
    );

    if (
      attempt < 2 &&
      retryableGeminiStatuses.has(response.status)
    ) {
      await delay(1_000);
      continue;
    }

    throw new Error(`Gemini evaluation failed: ${message}`);
  }

  throw new Error("Gemini evaluation failed.");
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!authorization || !supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Authentication is required." }, 401);
  }

  if (!geminiApiKey) {
    return jsonResponse(
      { error: "Gemini evaluation is not configured on the server." },
      503,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "Invalid or expired session." }, 401);
  }

  let input: EvaluationInput;

  try {
    input = (await request.json()) as EvaluationInput;
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  if (
    input.user_id !== user.id ||
    !input.topic_id ||
    !input.question_id ||
    !questionTypes.has(input.question_type) ||
    !cleanText(input.user_answer, 12000)
  ) {
    return jsonResponse({ error: "Invalid evaluation request." }, 400);
  }

  const { data: prompt, error: promptError } = await supabase
    .from("retrieval_prompts")
    .select("id, topic_id, prompt, prompt_type")
    .eq("id", input.question_id)
    .eq("user_id", user.id)
    .single();

  if (
    promptError ||
    !prompt ||
    prompt.topic_id !== input.topic_id
  ) {
    return jsonResponse({ error: "Question not found." }, 404);
  }

  const canonicalInput: EvaluationInput = {
    ...input,
    question_text: prompt.prompt,
    question_type: prompt.prompt_type as QuestionType,
    user_id: user.id,
  };

  try {
    const payload = await requestGemini(geminiApiKey, canonicalInput);

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!text) {
      return jsonResponse({ error: "Gemini returned an empty evaluation." }, 502);
    }

    return jsonResponse(normalizeEvaluation(JSON.parse(text)));
  } catch (error) {
    const message =
      error instanceof Error &&
          (error.name === "TimeoutError" || error.name === "AbortError")
        ? "Gemini evaluation timed out. Please try again."
        : error instanceof Error
          ? error.message
          : "Evaluation failed.";

    return jsonResponse({ error: message }, 502);
  }
});
