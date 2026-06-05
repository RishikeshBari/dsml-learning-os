const geminiModel = "gemini-3.5-flash";
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
  prompt: string;
  systemInstruction?: string;
};

export async function generateGeminiText({
  apiKey,
  prompt,
  systemInstruction,
}: GenerateGeminiTextInput) {
  const response = await fetch(geminiEndpoint, {
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 900,
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
}

export function getGeminiModelName() {
  return geminiModel;
}
