const storageKey = "dsml-learning-os.gemini-api-key";

export function getStoredGeminiApiKey() {
  return window.localStorage.getItem(storageKey) ?? "";
}

export function saveStoredGeminiApiKey(apiKey: string) {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, trimmedKey);
}

export function clearStoredGeminiApiKey() {
  window.localStorage.removeItem(storageKey);
}
