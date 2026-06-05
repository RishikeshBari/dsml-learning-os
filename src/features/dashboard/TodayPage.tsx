import { CalendarDays, CheckCircle2, Database, ShieldCheck } from "lucide-react";
import { useProfile } from "@/features/auth/useProfile";

const setupChecks = [
  {
    label: "React + Vite app shell",
    detail: "TypeScript, routing, Tailwind, and app providers are wired.",
    icon: CheckCircle2,
  },
  {
    label: "Supabase client",
    detail: "Frontend reads credentials from Vite environment variables.",
    icon: Database,
  },
  {
    label: "Protected routes",
    detail: "Unauthenticated users are redirected to Google sign-in.",
    icon: ShieldCheck,
  },
  {
    label: "Session persistence",
    detail: "Supabase restores the active session on reload.",
    icon: CalendarDays,
  },
];

export function TodayPage() {
  const profileQuery = useProfile();
  const profile = profileQuery.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
        <p className="text-sm font-medium text-mint-500">Authenticated</p>
        <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
          {profile?.display_name
            ? `Welcome, ${profile.display_name}`
            : "Welcome to your Learning OS"}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600 dark:text-white/60">
          Phase 2 verifies the foundation: Google auth, Supabase sessions,
          profile loading, protected routes, and deployment-ready environment
          variables.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {setupChecks.map((item) => (
          <article
            className="rounded-xl border border-ink-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
            key={item.label}
          >
            <item.icon aria-hidden="true" className="h-5 w-5 text-mint-500" />
            <h3 className="mt-4 text-sm font-semibold">{item.label}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500 dark:text-white/55">
              {item.detail}
            </p>
          </article>
        ))}
      </section>

      {profileQuery.isError ? (
        <section className="rounded-xl border border-signal-amber/30 bg-signal-amber/10 p-4 text-sm text-ink-700 dark:text-white/75">
          Profile loading failed. Confirm the Supabase migration has been run
          and Google sign-up created the matching profile row.
        </section>
      ) : null}
    </div>
  );
}

