import { getDataChangingE2eConfig } from "./data-changing-env";

type Env = Partial<Record<string, string | undefined>>;

const recordLifecycleReadyVariable = "E2E_RECORD_LIFECYCLE_READY";

export function getRecordLifecycleE2eConfig(env: Env = process.env) {
  const config = getDataChangingE2eConfig(env);
  const lifecycleReady = env[recordLifecycleReadyVariable] === "true";
  const missingLifecycleVariables = config.enabled && !lifecycleReady
    ? [recordLifecycleReadyVariable]
    : [];

  return {
    ...config,
    missingVariables: [...config.missingVariables, ...missingLifecycleVariables],
    lifecycleReady,
  };
}

export function shouldRunRecordLifecycleE2e(env: Env = process.env) {
  const config = getRecordLifecycleE2eConfig(env);
  return config.enabled && config.missingVariables.length === 0 && config.lifecycleReady;
}
