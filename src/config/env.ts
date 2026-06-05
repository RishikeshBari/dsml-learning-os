type EnvConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function readEnvValue(key: string) {
  const value = import.meta.env[key];

  if (!value || typeof value !== "string") {
    return "";
  }

  return value;
}

export const env: EnvConfig = {
  supabaseUrl: readEnvValue("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnvValue("VITE_SUPABASE_ANON_KEY"),
};

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey,
);

