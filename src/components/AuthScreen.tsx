import { BrainCircuit, CalendarDays, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AuthScreen() {
  const { authError, isConfigured, signInWithGoogle } = useAuth();

  return (
    <main className="min-h-screen overflow-hidden bg-ink-50 text-ink-950 transition-colors dark:bg-ink-950 dark:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_28rem),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.2),_transparent_26rem)]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-3 py-1 text-sm font-medium text-ink-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-ink-200">
              <Sparkles className="h-4 w-4 text-blue-500" />
              2-year DS/ML mastery workspace
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-ink-950 dark:text-white md:text-7xl">
                Your premium learning OS for Data Science and ML.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-ink-600 dark:text-ink-300">
                Track topics, revisions, retrieval practice, projects, and placement readiness from a single focused dashboard.
              </p>
            </div>
            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                { icon: CalendarDays, label: 'Class-aware reviews' },
                { icon: BrainCircuit, label: 'R/S/G mastery loop' },
                { icon: ShieldCheck, label: 'Private Supabase data' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-ink-200 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
                  <item.icon className="mb-3 h-5 w-5 text-blue-500" />
                  <p className="text-sm font-medium text-ink-700 dark:text-ink-200">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-glow backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/85">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-950 text-white dark:bg-white dark:text-ink-950">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold">DS/ML Learning OS</p>
                <p className="text-sm text-ink-500 dark:text-ink-400">Phase 2 authentication</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                disabled={!isConfigured}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-ink-950 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-ink-950/10 transition hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-300 disabled:text-ink-500 disabled:hover:translate-y-0 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100 dark:disabled:bg-ink-700 dark:disabled:text-ink-400"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-ink-950 dark:bg-ink-950 dark:text-white">G</span>
                Continue with Google
              </button>
              <p className="text-center text-sm leading-6 text-ink-500 dark:text-ink-400">
                Session persistence is handled by Supabase Auth. Your learning records are protected by Row Level Security.
              </p>
            </div>

            {authError ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                {authError}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
