import { Navigate } from "react-router-dom";
import { Database, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/config/env";
import { useAuth } from "@/features/auth/useAuth";

export function AuthPage() {
  const { isAuthenticated, isLoading, signInWithGoogle } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-ink-50 px-5 py-8 text-ink-950 dark:bg-ink-950 dark:text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/60">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Phase 2 foundation
            </div>
            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                DS/ML Learning OS
              </h1>
              <p className="max-w-xl text-base leading-7 text-ink-600 dark:text-white/65 sm:text-lg">
                Sign in to sync your learning system across laptop, mobile, and
                tablet.
              </p>
            </div>
            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-ink-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <ShieldCheck
                  aria-hidden="true"
                  className="mb-3 h-5 w-5 text-mint-500"
                />
                <p className="text-sm font-semibold">Google authentication</p>
                <p className="mt-1 text-sm text-ink-500 dark:text-white/55">
                  Supabase manages secure OAuth sessions.
                </p>
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <Database
                  aria-hidden="true"
                  className="mb-3 h-5 w-5 text-mint-500"
                />
                <p className="text-sm font-semibold">Cloud sync ready</p>
                <p className="mt-1 text-sm text-ink-500 dark:text-white/55">
                  Your profile and settings bootstrap after sign-up.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-6">
              <p className="text-sm font-medium text-ink-500 dark:text-white/55">
                Welcome
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Continue securely</h2>
            </div>
            {!isSupabaseConfigured ? (
              <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
                Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to a local
                `.env` file to enable sign-in.
              </div>
            ) : null}
            <Button
              className="mt-5 w-full"
              disabled={isLoading || !isSupabaseConfigured}
              onClick={signInWithGoogle}
            >
              Continue with Google
            </Button>
            <p className="mt-4 text-center text-xs leading-5 text-ink-500 dark:text-white/45">
              Sessions persist automatically through Supabase Auth.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

