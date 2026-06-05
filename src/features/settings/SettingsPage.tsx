import { CheckCircle2, KeyRound, Trash2, Zap } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  generateGeminiText,
  getGeminiModelName,
} from "@/features/gemini/geminiClient";
import {
  clearStoredGeminiApiKey,
  getStoredGeminiApiKey,
  saveStoredGeminiApiKey,
} from "@/features/gemini/geminiStorage";

export function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedKey = getStoredGeminiApiKey();

    setApiKey(storedKey);
    setIsSaved(Boolean(storedKey));
  }, []);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveStoredGeminiApiKey(apiKey);
    setIsSaved(Boolean(apiKey.trim()));
    setTestResult("");
    setError("");
  }

  function handleClear() {
    clearStoredGeminiApiKey();
    setApiKey("");
    setIsSaved(false);
    setTestResult("");
    setError("");
  }

  async function handleTest() {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setError("Gemini API key is required.");
      return;
    }

    setIsTesting(true);
    setError("");
    setTestResult("");

    try {
      const result = await generateGeminiText({
        apiKey: trimmedKey,
        prompt:
          "Reply in one short sentence confirming Gemini is connected for a DS/ML learning app.",
        systemInstruction:
          "You are a concise assistant for testing API connectivity.",
      });

      setTestResult(result);
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "Gemini test failed.",
      );
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {error ? (
        <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint-500/10 p-2 text-mint-500">
              <KeyRound aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Gemini</h2>
              <p className="mt-1 text-xs text-ink-500 dark:text-white/50">
                {getGeminiModelName()}
              </p>
            </div>
          </div>
          {isSaved ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-signal-green/10 px-3 py-2 text-xs font-semibold text-signal-green">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              Saved
            </span>
          ) : null}
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSave}>
          <label className="block">
            <span className="text-sm font-medium">API key</span>
            <input
              autoComplete="off"
              className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-mint-500 dark:border-white/10 dark:bg-white/5"
              onChange={(event) => {
                setApiKey(event.target.value);
                setIsSaved(false);
                setTestResult("");
                setError("");
              }}
              type="password"
              value={apiKey}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button disabled={!apiKey.trim()} type="submit">
              Save key
            </Button>
            <Button
              className="gap-2"
              disabled={!apiKey.trim() || isTesting}
              onClick={handleTest}
              type="button"
              variant="secondary"
            >
              <Zap aria-hidden="true" className="h-4 w-4" />
              {isTesting ? "Testing" : "Test"}
            </Button>
            <Button
              className="gap-2"
              disabled={!apiKey.trim()}
              onClick={handleClear}
              type="button"
              variant="secondary"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </form>
      </section>

      {testResult ? (
        <section className="rounded-lg border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-sm font-semibold">Test Result</h2>
          <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-white/65">
            {testResult}
          </p>
        </section>
      ) : null}
    </div>
  );
}
