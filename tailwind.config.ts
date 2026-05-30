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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        /* Redesign 2026 — Sage + Cream + Slate.
         * Spec: docs/design/redesign-2026-sage-cream-slate.md
         * Phase 1: tokens available as Tailwind utilities (bg-ff-bg,
         * text-ff-foreground, etc.) but no component consumes them yet. */
        ff: {
          bg: "rgb(var(--ff-bg) / <alpha-value>)",
          "bg-soft": "rgb(var(--ff-bg-soft) / <alpha-value>)",
          card: "rgb(var(--ff-card) / <alpha-value>)",
          popover: "rgb(var(--ff-popover) / <alpha-value>)",
          foreground: "rgb(var(--ff-foreground) / <alpha-value>)",
          muted: "rgb(var(--ff-muted) / <alpha-value>)",
          "muted-foreground": "rgb(var(--ff-muted-foreground) / <alpha-value>)",
          "subtle-foreground": "rgb(var(--ff-subtle-foreground) / <alpha-value>)",
          border: "rgb(var(--ff-border) / <alpha-value>)",
          "border-strong": "rgb(var(--ff-border-strong) / <alpha-value>)",
          input: "rgb(var(--ff-input) / <alpha-value>)",
          primary: {
            DEFAULT: "rgb(var(--ff-primary) / <alpha-value>)",
            hover: "rgb(var(--ff-primary-hover) / <alpha-value>)",
            soft: "rgb(var(--ff-primary-soft) / <alpha-value>)",
            foreground: "rgb(var(--ff-primary-foreground) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "rgb(var(--ff-accent) / <alpha-value>)",
            foreground: "rgb(var(--ff-accent-foreground) / <alpha-value>)",
          },
          ring: "rgb(var(--ff-ring) / <alpha-value>)",
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
          chart: {
            "1": "rgb(var(--ff-chart-1) / <alpha-value>)",
            "2": "rgb(var(--ff-chart-2) / <alpha-value>)",
            "3": "rgb(var(--ff-chart-3) / <alpha-value>)",
            "4": "rgb(var(--ff-chart-4) / <alpha-value>)",
            "5": "rgb(var(--ff-chart-5) / <alpha-value>)",
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
