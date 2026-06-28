import { generateCompletion } from '../adapter';

export async function authProvider(prompt: string, params: Record<string, unknown> = {}) {
  return generateCompletion(prompt, params);
}