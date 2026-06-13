import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f8fafc",
          100: "#eef2f7",
          200: "#d9e2ef",
          500: "#64748b",
          700: "#334155",
          900: "#0f172a",
          950: "#020617",
        },
        mint: {
          400: "#5eead4",
          500: "#14b8a6",
        },
        signal: {
          red: "#f97373",
          amber: "#f59e0b",
          green: "#22c55e",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        raised:
          "0 1px 2px rgba(15, 23, 42, 0.06), 0 16px 36px rgba(15, 23, 42, 0.10)",
        soft:
          "0 1px 2px rgba(15, 23, 42, 0.05), 0 8px 24px rgba(15, 23, 42, 0.07)",
      },
    },
  },
  plugins: [],
} satisfies Config;
