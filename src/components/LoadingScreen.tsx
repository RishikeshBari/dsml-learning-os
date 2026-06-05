import { BrainCircuit } from 'lucide-react';

export function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink-50 text-ink-950 dark:bg-ink-950 dark:text-white">
      <div className="flex items-center gap-4 rounded-3xl border border-ink-200 bg-white px-6 py-5 shadow-sm dark:border-white/10 dark:bg-white/10">
        <div className="grid h-11 w-11 animate-pulse place-items-center rounded-2xl bg-ink-950 text-white dark:bg-white dark:text-ink-950">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">Loading your learning OS</p>
          <p className="text-sm text-ink-500 dark:text-ink-400">Restoring secure session…</p>
        </div>
      </div>
    </main>
  );
}
