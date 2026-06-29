export const AI_PROVIDER = process.env.AI_PROVIDER || "openrouter";
export const AI_API_KEY =
  process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY || "";
export const AI_MODEL =
  process.env.AI_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";