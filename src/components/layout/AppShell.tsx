import {
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarClock,
  FolderGit2,
  LogOut,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/useAuth";
import { GlobalSearch } from "@/features/search/GlobalSearch";
import { useTheme } from "@/features/theme/useTheme";

type NavItem = {
  icon: LucideIcon;
  label: string;
  path?: string;
  shortLabel?: string;
};

const navItems: NavItem[] = [
  {
    icon: CalendarClock,
    label: "Today Dashboard",
    path: "/",
    shortLabel: "Today",
  },
  { icon: BookOpenCheck, label: "Topics", path: "/topics" },
  { icon: RotateCcw, label: "Revisions", path: "/revisions" },
  { icon: Brain, label: "Retrieval", path: "/retrieval" },
  { icon: FolderGit2, label: "Projects", path: "/projects" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const mobileNavItems = navItems.slice(0, 5);

function formatToday() {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "long",
  }).format(new Date());
}

export function AppShell() {
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const currentItem =
    navItems.find((item) => item.path === location.pathname) ?? navItems[0];

  return (
    <div className="min-h-screen bg-ink-50 text-ink-950 dark:bg-ink-950 dark:text-white lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] lg:h-screen lg:min-h-0">
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-ink-200/80 bg-white/80 px-5 py-6 backdrop-blur dark:border-white/15 dark:bg-white/[0.03] lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-950 text-sm font-semibold text-white dark:bg-white dark:text-ink-950">
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
            {navItems.map((item) =>
              item.path ? (
                <NavLink
                  className={({ isActive }) =>
                    clsx(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition",
                      isActive
                        ? "bg-ink-950 text-white shadow-soft dark:bg-white dark:text-ink-950"
                        : "text-ink-600 hover:bg-ink-100 dark:text-white/60 dark:hover:bg-white/10",
                    )
                  }
                  end={item.path === "/"}
                  key={item.label}
                  to={item.path}
                >
                  <item.icon aria-hidden="true" className="h-4 w-4" />
                  {item.shortLabel ?? item.label}
                </NavLink>
              ) : (
                <button
                  className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-400 dark:text-white/30"
                  disabled
                  key={item.label}
                  type="button"
                >
                  <item.icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </button>
              ),
            )}
          </nav>
          <div className="mt-8 rounded-lg border border-ink-200 bg-ink-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-medium text-ink-500 dark:text-white/50">
              Phase 6
            </p>
            <p className="mt-1 text-sm font-semibold">Gemini Integration</p>
            <div className="mt-4 h-2 rounded-full bg-ink-200 dark:bg-white/10">
              <div className="h-2 w-3/5 rounded-full bg-mint-500" />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-ink-950/90 sm:px-6">
            <div className="grid items-center gap-3 lg:grid-cols-[minmax(180px,0.7fr)_minmax(280px,1.5fr)_auto]">
              <div className="min-w-0 pr-24 sm:pr-44 lg:pr-0">
                <p className="text-xs font-medium uppercase text-ink-500 dark:text-white/45">
                  {formatToday()}
                </p>
                <h1 className="truncate text-base font-semibold sm:text-lg">
                  {currentItem.label}
                </h1>
              </div>
              <GlobalSearch />
              <div className="absolute right-4 top-3 flex items-center gap-2 sm:right-6 lg:static lg:justify-end">
                <span className="hidden max-w-48 truncate text-sm text-ink-500 dark:text-white/55 xl:inline">
                  {user?.email}
                </span>
                <button
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 transition hover:bg-ink-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  onClick={toggleTheme}
                  type="button"
                >
                  {theme === "dark" ? (
                    <Sun aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Moon aria-hidden="true" className="h-4 w-4" />
                  )}
                </button>
                <Button
                  aria-label="Sign out"
                  className="hidden gap-2 sm:inline-flex"
                  onClick={signOut}
                  variant="secondary"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:overflow-y-auto lg:py-8 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-200 bg-white/95 px-2 py-2 backdrop-blur dark:border-white/10 dark:bg-ink-950/95 lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileNavItems.map((item) =>
            item.path ? (
              <NavLink
                className={({ isActive }) =>
                  clsx(
                    "flex min-h-12 flex-col items-center justify-center rounded-lg px-1 text-xs font-medium transition",
                    isActive
                      ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950"
                      : "text-ink-500 hover:bg-ink-100 dark:text-white/55 dark:hover:bg-white/10",
                  )
                }
                end={item.path === "/"}
                key={item.label}
                to={item.path}
              >
                <item.icon aria-hidden="true" className="mb-1 h-4 w-4" />
                <span className="max-w-full truncate">
                  {item.shortLabel ?? item.label}
                </span>
              </NavLink>
            ) : (
              <button
                className="flex min-h-12 cursor-not-allowed flex-col items-center justify-center rounded-lg px-1 text-xs font-medium text-ink-400 dark:text-white/30"
                disabled
                key={item.label}
                type="button"
              >
                <item.icon aria-hidden="true" className="mb-1 h-4 w-4" />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            ),
          )}
        </div>
      </nav>
    </div>
  );
}
