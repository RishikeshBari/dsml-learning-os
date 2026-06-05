import { BarChart3, BookOpenCheck, BrainCircuit, CalendarDays, Home, Layers3, LogOut, Moon, RefreshCcw, Settings, SunMedium } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
  { label: 'Today', icon: Home },
  { label: 'Topics', icon: Layers3 },
  { label: 'Revisions', icon: BookOpenCheck },
  { label: 'Retrieval', icon: BrainCircuit },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];

const weekdayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(2024, 0, 1, hour, minute));
}

export function DashboardShell() {
  const { bootstrapState, classSchedule, profile, refreshBootstrapData, settings, signOut, user } = useAuth();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const displayName = profile?.display_name || user?.email || 'Learner';
  const firstName = displayName.split(' ')[0];
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    [],
  );

  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    setIsDark(document.documentElement.classList.contains('dark'));
  }

  return (
    <main className="min-h-screen bg-ink-100 text-ink-950 transition-colors dark:bg-ink-950 dark:text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-ink-200 bg-white/80 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/75 lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink-950 text-white dark:bg-white dark:text-ink-950">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Learning OS</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">DS/ML program</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navigation.map((item, index) => (
              <button
                key={item.label}
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  index === 0
                    ? 'bg-ink-950 text-white shadow-sm dark:bg-white dark:text-ink-950'
                    : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/10'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 border-b border-ink-200 bg-ink-100/85 px-5 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-ink-950/85 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-ink-500 dark:text-ink-400">{today}</p>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {firstName}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-ink-200 bg-white text-ink-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-ink-200"
                  aria-label="Toggle theme"
                >
                  {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-ink-200 bg-white text-ink-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-ink-200"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-[1fr_22rem]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-ink-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/10">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-500">Today dashboard</p>
                    <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">Start with due revisions, then capture new topics after class.</h2>
                    <p className="mt-3 max-w-2xl text-ink-600 dark:text-ink-300">
                      Phase 2 is wired to Supabase Auth. Phase 3 will replace these placeholders with live progress cards and charts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void refreshBootstrapData()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh profile
                  </button>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Due reviews', value: '0', helper: 'Ready for Phase 4 data' },
                  { label: 'Retrieval sessions', value: '0', helper: 'Sunday engine in Phase 5' },
                  { label: 'Projects tracked', value: '0', helper: 'Portfolio loop in Phase 8' },
                ].map((card) => (
                  <article key={card.label} className="rounded-[1.5rem] border border-ink-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/10">
                    <p className="text-sm text-ink-500 dark:text-ink-400">{card.label}</p>
                    <p className="mt-3 text-4xl font-semibold tracking-tight">{card.value}</p>
                    <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{card.helper}</p>
                  </article>
                ))}
              </section>

              <section className="rounded-[2rem] border border-ink-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/10">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">R/S/G distribution</h2>
                    <p className="text-sm text-ink-500 dark:text-ink-400">Empty-state preview until topics are created.</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { bucket: 'R', label: 'Red: needs work', color: 'bg-rose-500' },
                    { bucket: 'S', label: 'Stable: review soon', color: 'bg-amber-500' },
                    { bucket: 'G', label: 'Green: strong', color: 'bg-emerald-500' },
                  ].map((bucket) => (
                    <div key={bucket.bucket} className="rounded-2xl border border-ink-200 p-4 dark:border-white/10">
                      <div className={`mb-4 h-2 rounded-full ${bucket.color}`} />
                      <p className="text-3xl font-semibold">0</p>
                      <p className="text-sm text-ink-500 dark:text-ink-400">{bucket.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-ink-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/10">
                <div className="mb-5 flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Class schedule</h2>
                </div>
                <div className="space-y-3">
                  {classSchedule.length > 0 ? (
                    classSchedule.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-ink-200 p-4 dark:border-white/10">
                        <p className="font-medium">{weekdayLabels[item.weekday]}</p>
                        <p className="text-sm text-ink-500 dark:text-ink-400">
                          {formatTime(item.start_time)} – {formatTime(item.end_time)} · {item.label}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-ink-300 p-4 text-sm text-ink-500 dark:border-white/20 dark:text-ink-400">
                      Default Monday, Wednesday, and Friday classes appear here after your first Supabase profile bootstrap.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-ink-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/10">
                <h2 className="text-lg font-semibold">Account bootstrap</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500 dark:text-ink-400">Status</dt>
                    <dd className="font-medium capitalize">{bootstrapState}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500 dark:text-ink-400">Theme pref</dt>
                    <dd className="font-medium capitalize">{settings?.theme ?? 'system'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-500 dark:text-ink-400">Reminder email</dt>
                    <dd className="max-w-[12rem] truncate font-medium">{settings?.email ?? user?.email ?? 'Not set'}</dd>
                  </div>
                </dl>
              </section>
            </aside>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 rounded-[1.5rem] border border-ink-200 bg-white/90 p-2 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/90 lg:hidden">
        {navigation.slice(0, 6).map((item, index) => (
          <button key={item.label} type="button" className={`grid place-items-center gap-1 rounded-2xl px-2 py-2 text-[0.65rem] font-medium ${index === 0 ? 'bg-ink-950 text-white dark:bg-white dark:text-ink-950' : 'text-ink-500 dark:text-ink-400'}`}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
