import type { AiCommandType } from "./intent-router";
import type { ConfirmationLevel } from "./confirmation-policy";

export type CommandState = {
  type: AiCommandType;
  intent: string;
  data: Record<string, unknown>;
  originalText: string;
  resolved: Record<string, unknown>;
  missingFields: string[];
  confirmationLevel: ConfirmationLevel;
  confirmed: boolean;
  executed: boolean;
  expiresAt: number;
};

const COMMAND_TTL_MS = 5 * 60 * 1000;

const store = new Map<string, CommandState>();

export function createCommandState(
  id: string,
  type: AiCommandType,
  intent: string,
  originalText: string,
  confirmationLevel: ConfirmationLevel,
): CommandState {
  const state: CommandState = {
    type,
    intent,
    data: {},
    originalText,
    resolved: {},
    missingFields: [],
    confirmationLevel,
    confirmed: false,
    executed: false,
    expiresAt: Date.now() + COMMAND_TTL_MS,
  };

  store.set(id, state);
  return state;
}

export function getCommandState(id: string): CommandState | undefined {
  const state = store.get(id);
  if (!state) return undefined;
  if (Date.now() > state.expiresAt) {
    store.delete(id);
    return undefined;
  }
  return state;
}

export function updateCommandState(
  id: string,
  updates: Partial<CommandState>,
): CommandState | undefined {
  const state = getCommandState(id);
  if (!state) return undefined;
  Object.assign(state, updates);
  return state;
}

export function confirmCommand(id: string): CommandState | undefined {
  return updateCommandState(id, { confirmed: true });
}

export function executeCommand(id: string): CommandState | undefined {
  return updateCommandState(id, { executed: true });
}

export function removeCommandState(id: string): void {
  store.delete(id);
}
