import { AI_PROVIDER, OPENROUTER_API_KEY, OPENROUTER_MODEL } from '@/lib/env';

const providerMap: Record<string, string> = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

export async function generateCompletion(prompt: string, params: Record<string, unknown> = {}) {
  const provider = providerMap[AI_PROVIDER || 'openrouter'];
  const model = OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!provider || !OPENROUTER_API_KEY) {
    throw new Error('AI provider not configured');
  }

  const response = await fetch(provider, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      ...params,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider error: ${response.status}`);
  }

  return response.json();
}