const geminiModel = "gemini-2.5-flash";
const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

type GeminiPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: GeminiPart[];
    };
  }[];
  error?: {
    message?: string;
  };
};

type GenerateGeminiTextInput = {
  apiKey: string;
  maxOutputTokens?: number;
  prompt: string;
  responseJsonSchema?: unknown;
  responseMimeType?: "application/json" | "text/plain";
  systemInstruction?: string;
  timeoutMs?: number;
};

export async function generateGeminiText({
  apiKey,
  maxOutputTokens = 900,
  prompt,
  responseJsonSchema,
  responseMimeType,
  systemInstruction,
  timeoutMs = 45000,
}: GenerateGeminiTextInput) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(geminiEndpoint, {
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          }
        ],
        generationConfig: {
          maxOutputTokens,
          responseJsonSchema,
          responseMimeType,
          temperature: 1,
        },
        system_instruction: systemInstruction
          ? {
              parts: [{ text: systemInstruction }],
            }
          : undefined,
      }),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      method: "POST",
      signal: controller.signal,
    });
    const payload = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      throw new Error(
        payload.error?.message ?? "Gemini could not generate a response.",
      );
    }

    const text =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim() ?? "";

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return text;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Gemini request timed out. Try again in a moment.");
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function getGeminiModelName() {
  return geminiModel;
}
