import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type Action =
  | "generate_questions"
  | "evaluate_answer"
  | "revision_recap"
  | "mock_summary"
  | "crash_plan";

type RequestBody = {
  action: Action;
  user_id: string;
  module_id?: string;
  module_name?: string;
  topic_id?: string | null;
  topic_name?: string;
  difficulty?: "easy" | "medium" | "hard";
  question_type?:
    | "conceptual"
    | "coding"
    | "scenario_based"
    | "debugging"
    | "project_based"
    | "resume_based"
    | "hr_behavioral";
  count?: number;
  context?: string;
  question_id?: string;
  user_answer?: string;
  session_id?: string;
  readiness_context?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

const endpoint =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

const questionSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          question_text: { type: "string" },
          expected_skills: {
            type: "array",
            items: { type: "string" },
            maxItems: 6,
          },
          code_snippet: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
          suggested_time_minutes: {
            type: "integer",
            minimum: 2,
            maximum: 45,
          },
        },
        required: [
          "question_text",
          "expected_skills",
          "code_snippet",
          "suggested_time_minutes",
        ],
      },
    },
  },
  required: ["questions"],
};

const evaluationSchema = {
  type: "object",
  properties: {
    score: { type: "number", minimum: 0, maximum: 10 },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    answer_quality_label: {
      type: "string",
      enum: [
        "too_vague",
        "too_theoretical",
        "good_but_incomplete",
        "interview_ready",
        "needs_example",
        "needs_code_clarity",
        "conceptually_weak",
        "strong_answer",
      ],
    },
    correct_points: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    missing_points: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    mistakes: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    ideal_answer: { type: "string" },
    interview_friendly_answer: { type: "string" },
    natural_speaking_tip: { type: "string" },
    follow_up_questions: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    improvement_tips: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    example: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    code_snippet: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    common_mistakes: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    quick_revision_summary: { type: "string" },
  },
  required: [
    "score",
    "confidence",
    "answer_quality_label",
    "correct_points",
    "missing_points",
    "mistakes",
    "ideal_answer",
    "interview_friendly_answer",
    "natural_speaking_tip",
    "follow_up_questions",
    "improvement_tips",
    "example",
    "code_snippet",
    "common_mistakes",
    "quick_revision_summary",
  ],
};

const revisionSchema = {
  type: "object",
  properties: {
    key_concept: { type: "string" },
    simple_explanation: { type: "string" },
    analogy: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    formula_or_code: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
    interview_points: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    common_traps: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    two_minute_recap: { type: "string" },
  },
  required: [
    "key_concept",
    "simple_explanation",
    "analogy",
    "formula_or_code",
    "interview_points",
    "common_traps",
    "two_minute_recap",
  ],
};

const summarySchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    strong_areas: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    weak_areas: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5,
    },
    questions_to_reattempt: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
  },
  required: [
    "summary",
    "strong_areas",
    "weak_areas",
    "recommendations",
    "questions_to_reattempt",
  ],
};

const crashPlanSchema = {
  type: "object",
  properties: {
    overview: { type: "string" },
    days: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        properties: {
          day: { type: "integer", minimum: 1, maximum: 7 },
          focus: { type: "string" },
          actions: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 4,
          },
          target_minutes: {
            type: "integer",
            minimum: 20,
            maximum: 180,
          },
        },
        required: ["day", "focus", "actions", "target_minutes"],
      },
    },
  },
  required: ["overview", "days"],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: corsHeaders,
    status,
  });
}

function cleanText(value: unknown, maxLength = 12_000) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function promptFor(
  body: RequestBody,
  canonicalQuestion?: {
    question: string;
    question_type: string | null;
    difficulty_label: string | null;
  },
) {
  const shared = `You are a supportive DS/ML interview mentor. Be practical,
beginner-friendly, precise, and natural. Avoid textbook filler and polished
literary language. Return only JSON matching the provided schema.`;

  if (body.action === "generate_questions") {
    const hrGuidance =
      body.question_type === "hr_behavioral"
        ? "Use behavioral prompts where STAR structure (Situation, Task, Action, Result) is useful. Test clarity, authenticity, relevance, and confidence."
        : "";

    return `${shared}
Generate ${Math.max(1, Math.min(10, body.count ?? 3))} genuinely useful
interview questions.
Module: ${cleanText(body.module_name, 120)}
Topic: ${cleanText(body.topic_name, 200) || "mixed high-value topics"}
Difficulty: ${body.difficulty ?? "medium"}
Question type: ${body.question_type ?? "conceptual"}
Optional candidate context: ${cleanText(body.context, 8_000) || "None"}
${hrGuidance}
Questions must be clear, practical, beginner-to-intermediate friendly, and
relevant to DS/ML placement preparation. Do not create generic trivia.`;
  }

  if (body.action === "evaluate_answer" && canonicalQuestion) {
    const starGuidance =
      canonicalQuestion.question_type === "hr_behavioral"
        ? "For this behavioral answer, assess STAR structure without forcing a robotic script."
        : "";

    return `${shared}
Evaluate the candidate answer gently but meaningfully.
Question: ${canonicalQuestion.question}
Type: ${canonicalQuestion.question_type ?? "conceptual"}
Difficulty: ${canonicalQuestion.difficulty_label ?? "medium"}
Candidate answer: ${cleanText(body.user_answer, 15_000)}
${starGuidance}

Reward correct core understanding, practical thinking, clear reasoning, good
examples, and correct code logic. Do not heavily punish grammar, informal
English, or minor missing detail when the core idea is right. Never score an
answer low merely because it is short. Identify real misconceptions, vagueness,
missing key points, over-theoretical wording, and weak code clarity.

Score 0-10. A directionally correct but incomplete answer should land in the
middle. A mostly correct usable answer should usually score 7-8. Reserve 9-10
for clear, accurate, interview-ready understanding.`;
  }

  if (body.action === "revision_recap") {
    return `${shared}
Create a short two-minute revision recap.
Module: ${cleanText(body.module_name, 120)}
Topic: ${cleanText(body.topic_name, 200)}
Keep it concise: key concept, simple explanation, optional analogy,
formula/code only if useful, interview points, common traps, and a final
two-minute recap.`;
  }

  if (body.action === "mock_summary") {
    return `${shared}
Summarize this mock interview from the supplied attempt context.
${cleanText(body.context, 16_000)}
Be encouraging and specific. Name strong areas, weak areas, the highest-value
next practice, and questions worth re-attempting.`;
  }

  return `${shared}
Build a focused seven-day interview crash plan from this readiness context:
${cleanText(body.readiness_context, 16_000)}
Prioritize weak modules, low-scoring topics, high-frequency DS/ML interview
concepts, speaking practice, coding practice, and one realistic mock interview.
Keep each day achievable and focused.`;
}

function schemaFor(action: Action) {
  if (action === "generate_questions") return questionSchema;
  if (action === "evaluate_answer") return evaluationSchema;
  if (action === "revision_recap") return revisionSchema;
  if (action === "mock_summary") return summarySchema;
  return crashPlanSchema;
}

async function callGemini(
  apiKey: string,
  action: Action,
  prompt: string,
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: action === "crash_plan" ? 2400 : 1800,
        responseJsonSchema: schemaFor(action),
        responseMimeType: "application/json",
        temperature: action === "evaluate_answer" ? 0.2 : 0.45,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(55_000),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ?? "Gemini interview request failed.",
    );
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(text);
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
      { error: "Gemini is not configured on the server." },
      503,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "Invalid or expired session." }, 401);
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const actions = new Set<Action>([
    "generate_questions",
    "evaluate_answer",
    "revision_recap",
    "mock_summary",
    "crash_plan",
  ]);

  if (body.user_id !== user.id || !actions.has(body.action)) {
    return jsonResponse({ error: "Invalid interview AI request." }, 400);
  }

  let canonicalQuestion:
    | {
        question: string;
        question_type: string | null;
        difficulty_label: string | null;
      }
    | undefined;

  if (body.module_id) {
    const { data: moduleRow } = await supabase
      .from("interview_modules")
      .select("id")
      .eq("id", body.module_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!moduleRow) {
      return jsonResponse({ error: "Interview module not found." }, 404);
    }
  }

  if (body.action === "evaluate_answer") {
    if (!body.question_id || !cleanText(body.user_answer)) {
      return jsonResponse({ error: "Question and answer are required." }, 400);
    }

    const { data: question } = await supabase
      .from("interview_questions")
      .select("question, question_type, difficulty_label")
      .eq("id", body.question_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!question) {
      return jsonResponse({ error: "Interview question not found." }, 404);
    }

    canonicalQuestion = question;
  }

  if (body.action === "mock_summary" && body.session_id) {
    const { data: session } = await supabase
      .from("interview_sessions")
      .select("id")
      .eq("id", body.session_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session) {
      return jsonResponse({ error: "Mock interview not found." }, 404);
    }
  }

  try {
    const result = await callGemini(
      geminiApiKey,
      body.action,
      promptFor(body, canonicalQuestion),
    );
    return jsonResponse(result);
  } catch (error) {
    const message =
      error instanceof Error &&
          (error.name === "TimeoutError" || error.name === "AbortError")
        ? "Gemini timed out. Please try again."
        : error instanceof Error
          ? error.message
          : "Interview AI request failed.";

    console.error(JSON.stringify({ action: body.action, message }));
    return jsonResponse({ error: message }, 502);
  }
});
