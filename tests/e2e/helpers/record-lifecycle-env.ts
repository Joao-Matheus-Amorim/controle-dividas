import { getDataChangingE2eConfig } from "./data-changing-env";

type Env = Partial<Record<string, string | undefined>>;

const requiredRecordLifecycleVariables = [
  "E2E_RECORD_LIFECYCLE_READY",
] as const;

export function getRecordLifecycleE2eConfig(env: Env = process.env) {
  const config = getDataChangingE2eConfig(env);
  const missingLifecycleVariables = config.enabled
    ? requiredRecordLifecycleVariables.filter((key) => !env[key])
    : [];

  return {
    ...config,
    missingVariables: [...config.missingVariables, ...missingLifecycleVariables],
    lifecycleReady: env.E2E_RECORD_LIFECYCLE_READY,
  };
}

export function shouldRunRecordLifecycleE2e(env: Env = process.env) {
  const config = getRecordLifecycleE2eConfig(env);
  return config.enabled && config.missingVariables.length === 0;
}
