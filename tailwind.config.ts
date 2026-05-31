import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Shadcn semantic tokens. Vars hold space-separated RGB triplets
         * (e.g. `--background: 250 248 243`) and resolve via `--ff-*` aliases.
         * See app/globals.css and docs/design/redesign-2026-sage-cream-slate.md. */
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        chart: {
          "1": "rgb(var(--chart-1) / <alpha-value>)",
          "2": "rgb(var(--chart-2) / <alpha-value>)",
          "3": "rgb(var(--chart-3) / <alpha-value>)",
          "4": "rgb(var(--chart-4) / <alpha-value>)",
          "5": "rgb(var(--chart-5) / <alpha-value>)",
        },
        /* Extended FF tokens for cases the shadcn vocabulary doesn't cover
         * (soft variants, subtle text, hover state, info channel). */
        ff: {
          "bg-soft": "rgb(var(--ff-bg-soft) / <alpha-value>)",
          "subtle-foreground": "rgb(var(--ff-subtle-foreground) / <alpha-value>)",
          "border-strong": "rgb(var(--ff-border-strong) / <alpha-value>)",
          primary: {
            DEFAULT: "rgb(var(--ff-primary) / <alpha-value>)",
            hover: "rgb(var(--ff-primary-hover) / <alpha-value>)",
            soft: "rgb(var(--ff-primary-soft) / <alpha-value>)",
            foreground: "rgb(var(--ff-primary-foreground) / <alpha-value>)",
          },
          success: {
            DEFAULT: "rgb(var(--ff-success) / <alpha-value>)",
            soft: "rgb(var(--ff-success-soft) / <alpha-value>)",
          },
          warning: {
            DEFAULT: "rgb(var(--ff-warning) / <alpha-value>)",
            soft: "rgb(var(--ff-warning-soft) / <alpha-value>)",
          },
          destructive: {
            DEFAULT: "rgb(var(--ff-destructive) / <alpha-value>)",
            soft: "rgb(var(--ff-destructive-soft) / <alpha-value>)",
            foreground: "rgb(var(--ff-destructive-foreground) / <alpha-value>)",
          },
          info: {
            DEFAULT: "rgb(var(--ff-info) / <alpha-value>)",
            soft: "rgb(var(--ff-info-soft) / <alpha-value>)",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "ff-xs": "var(--ff-radius-xs)",
        "ff-sm": "var(--ff-radius-sm)",
        "ff-md": "var(--ff-radius-md)",
        "ff-lg": "var(--ff-radius-lg)",
        "ff-xl": "var(--ff-radius-xl)",
        "ff-2xl": "var(--ff-radius-2xl)",
      },
      boxShadow: {
        "ff-xs": "var(--ff-shadow-xs)",
        "ff-sm": "var(--ff-shadow-sm)",
        "ff-md": "var(--ff-shadow-md)",
        "ff-lg": "var(--ff-shadow-lg)",
      },
      transitionDuration: {
        "ff-fast": "var(--ff-motion-fast)",
        "ff-base": "var(--ff-motion-base)",
        "ff-slow": "var(--ff-motion-slow)",
      },
      transitionTimingFunction: {
        "ff-spring": "var(--ff-easing-spring)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
