import { shouldFailFastForMissingRuntimeEnv } from "@/lib/utils";

const AI_FINANCE_PROVIDER_REQUIRED_ENV_VARS = [
  "AI_FINANCE_PROVIDER",
  "AI_FINANCE_MODEL",
  "AI_FINANCE_PROVIDER_API_KEY",
] as const;

export type AiFinanceProviderRequiredEnvVar =
  (typeof AI_FINANCE_PROVIDER_REQUIRED_ENV_VARS)[number];

export type AiFinanceProviderConfigurationBoundary = {
  providerEnabled: boolean;
  ready: boolean;
  missingEnvVars: AiFinanceProviderRequiredEnvVar[];
};

function readEnvValue(name: AiFinanceProviderRequiredEnvVar) {
  return process.env[name]?.trim() ?? "";
}

export function isAiFinanceProviderEnabled() {
  return process.env.ENABLE_AI_FINANCE_PROVIDER === "true";
}

export function getMissingAiFinanceProviderEnvVars() {
  return AI_FINANCE_PROVIDER_REQUIRED_ENV_VARS.filter((name) => readEnvValue(name).length === 0);
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
