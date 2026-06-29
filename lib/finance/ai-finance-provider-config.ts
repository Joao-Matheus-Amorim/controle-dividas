import { shouldFailFastForMissingRuntimeEnv } from "@/lib/utils";

const AI_FINANCE_PROVIDER_REQUIRED_ENV_VARS = [
  "AI_PROVIDER",
  "AI_API_KEY",
  "AI_MODEL",
] as const;

export type AiFinanceProviderRequiredEnvVar =
  (typeof AI_FINANCE_PROVIDER_REQUIRED_ENV_VARS)[number];

export type AiFinanceProviderConfigurationBoundary = {
  providerEnabled: boolean;
  ready: boolean;
  missingEnvVars: AiFinanceProviderRequiredEnvVar[];
};

function readEnvValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function hasAnyApiKey(): boolean {
  return (
    readEnvValue("AI_API_KEY").length > 0 ||
    readEnvValue("OPENROUTER_API_KEY").length > 0
  );
}

function hasAnyModel(): boolean {
  return (
    readEnvValue("AI_MODEL").length > 0 ||
    readEnvValue("OPENROUTER_MODEL").length > 0
  );
}

export function isAiFinanceProviderEnabled() {
  return process.env.ENABLE_AI_FINANCE_PROVIDER === "true";
}

export function getMissingAiFinanceProviderEnvVars() {
  const missing: AiFinanceProviderRequiredEnvVar[] = [];

  if (!readEnvValue("AI_PROVIDER")) {
    missing.push("AI_PROVIDER");
  }

  if (!hasAnyApiKey()) {
    missing.push("AI_API_KEY");
  }

  if (!hasAnyModel()) {
    missing.push("AI_MODEL");
  }

  return missing;
}

export function getAiFinanceProviderConfigurationBoundary(): AiFinanceProviderConfigurationBoundary {
  const providerEnabled = isAiFinanceProviderEnabled();

  if (!providerEnabled) {
    return {
      providerEnabled: false,
      ready: false,
      missingEnvVars: [],
    };
  }

  const missingEnvVars = getMissingAiFinanceProviderEnvVars();

  return {
    providerEnabled: true,
    ready: missingEnvVars.length === 0,
    missingEnvVars,
  };
}

export function assertAiFinanceProviderConfigurationBoundary() {
  const boundary = getAiFinanceProviderConfigurationBoundary();

  if (!boundary.providerEnabled) {
    return boundary;
  }

  if (!boundary.ready && shouldFailFastForMissingRuntimeEnv()) {
    throw new Error(
      `AI finance provider runtime environment variables are missing. Set ${boundary.missingEnvVars.join(", ")}.`,
    );
  }

  return boundary;
}
