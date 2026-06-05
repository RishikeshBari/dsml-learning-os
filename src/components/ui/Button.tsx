import type { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  disabled,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-ink-950",
        variant === "primary" &&
          "bg-ink-950 text-white shadow-soft hover:bg-ink-700 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100",
        variant === "secondary" &&
          "border border-ink-200 bg-white text-ink-800 hover:bg-ink-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
        className,
      )}
      disabled={disabled}
      type={type}
      {...props}
    />
  );
}

