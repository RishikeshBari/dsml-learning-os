import { CheckCircle2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { ToastContext } from "@/components/ui/toastContext";

type Toast = {
  id: number;
  message: string;
};

const toastDuration = 2800;

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<Toast | null>(null);
  const nextId = useRef(0);
  const lastToast = useRef<{ message: string; shownAt: number } | null>(null);

  const showSuccess = useCallback((message: string) => {
    const now = Date.now();

    if (
      lastToast.current?.message === message &&
      now - lastToast.current.shownAt < 900
    ) {
      return;
    }

    lastToast.current = { message, shownAt: now };
    nextId.current += 1;
    setToast({ id: nextId.current, message });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), toastDuration);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showSuccess }}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex justify-center sm:inset-x-auto sm:right-5 sm:justify-end"
      >
        {toast ? (
          <div
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border border-signal-green/25 bg-white/95 px-4 py-3 text-sm shadow-raised backdrop-blur dark:border-signal-green/30 dark:bg-ink-900/95"
            key={toast.id}
            role="status"
          >
            <CheckCircle2
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-signal-green"
            />
            <p className="min-w-0 flex-1 font-medium">{toast.message}</p>
            <button
              aria-label="Dismiss notification"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => setToast(null)}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
