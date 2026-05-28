import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && supabasePublicKey,
);

export function shouldFailFastForMissingRuntimeEnv() {
  return process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
}
