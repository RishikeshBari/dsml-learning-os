import { BookOpenCheck, CalendarClock, Settings, Sparkles } from "lucide-react";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/useAuth";

const navItems = [
  { label: "Today", icon: CalendarClock },
  { label: "Topics", icon: BookOpenCheck },
  { label: "Insights", icon: Sparkles },
  { label: "Settings", icon: Settings },
];

export function AppShell() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 dark:bg-ink-950 dark:text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-64 border-r border-ink-200/70 bg-white/70 px-5 py-6 backdrop-blur dark:border-white/10 dark:bg-white/[0.03] lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-950 text-white dark:bg-white dark:text-ink-950">
              OS
            </div>
            <div>
              <p className="text-sm font-semibold">DS/ML</p>
              <p className="text-xs text-ink-500 dark:text-white/55">
                Learning OS
              </p>
            </div>
          </div>
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => (
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-700 transition hover:bg-ink-100 dark:text-white/70 dark:hover:bg-white/10"
                key={item.label}
                type="button"
              >
                <item.icon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-ink-200/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-ink-950/80 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-500 dark:text-white/45">
                  Phase 2
                </p>
                <h1 className="text-base font-semibold sm:text-lg">
                  Authentication + Supabase setup
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden max-w-48 truncate text-sm text-ink-500 dark:text-white/55 sm:inline">
                  {user?.email}
                </span>
                <Button onClick={signOut} variant="secondary">
                  Sign out
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

