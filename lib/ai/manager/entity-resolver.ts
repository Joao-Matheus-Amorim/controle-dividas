import { normalizeFinanceDraftText } from "@/lib/finance/finance-draft-utils";
import type { DbFamilyMember, DbExpenseCategory } from "@/lib/finance/types";

function normalize(text: string) {
  return normalizeFinanceDraftText(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreTokenMatch(textTokens: Set<string>, entityName: string): number {
  const name = normalize(entityName);
  let score = 0;

  if (textTokens.has(name)) {
    score += 100;
  }

  const nameTokens = name.split(/\s+/).filter(Boolean);
  for (const nt of nameTokens) {
    if (textTokens.has(nt)) {
      score += 10;
    }
  }

  return score;
}

function bestMatch<T extends { id: string; name: string }>(
  text: string,
  entities: T[],
): T | null {
  if (entities.length === 0) return null;

  const normalized = normalize(text);
  const stopWords = new Set([
    "a", "e", "o", "de", "da", "do", "para", "em", "no", "na", "por", "com",
    "se", "voce", "sua", "meu", "minha", "um", "uma", "os", "as", "dos", "das",
    "ao", "aos", "que", "pra", "pro", "pelo", "pela",
  ]);
  const textTokens = new Set(
    normalized.split(/\s+/).filter((t) => t.length > 1 && !stopWords.has(t)),
  );

  let best: T | null = null;
  let bestScore = 0;

  for (const entity of entities) {
    const score = scoreTokenMatch(textTokens, entity.name);
    if (score > bestScore) {
      bestScore = score;
      best = entity;
    }
  }

  return bestScore >= 10 ? best : null;
}

export function resolveMember(
  text: string,
  members: DbFamilyMember[],
): DbFamilyMember | null {
  const named = members.map((m) => ({ ...m, name: m.name }));
  return bestMatch(text, named);
}

export function resolveExpenseCategory(
  text: string,
  categories: DbExpenseCategory[],
): DbExpenseCategory | null {
  const named = categories.map((c) => ({ ...c, name: c.name }));
  return bestMatch(text, named);
}

export function resolvePayableBill(
  text: string,
  bills: Array<{ id: string; name: string; amount: number }>,
): { id: string; name: string; amount: number } | null {
  const withNamed = bills.map((b) => ({ ...b }));
  return bestMatch(text, withNamed);
}

export function resolveBankByName(
  text: string,
  bankNames: string[],
): string | null {
  const normalized = normalize(text);
  const stopWords = new Set(["banco", "conta", "cartao", "cartao"]);
  const textTokens = new Set(
    normalized.split(/\s+/).filter((t) => t.length > 1 && !stopWords.has(t)),
  );

  let best: string | null = null;
  let bestScore = 0;

  for (const name of bankNames) {
    const score = scoreTokenMatch(textTokens, name);
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }

  return bestScore >= 10 ? best : null;
}

export function parseRelativeDate(text: string, today: string): string | null {
  const normalized = normalize(text);
  const todayDate = new Date(today + "T00:00:00");

  if (/^ontem$/.test(normalized)) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  if (/^hoje$/.test(normalized)) {
    return today;
  }

  if (/^amanha|^amanha/.test(normalized)) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  const monthMatch = normalized.match(/^(mes\s+)?que\s+vem|proximo\s+mes|nesse\s+mes/i);
  if (monthMatch) {
    if (/que vem|proximo/.test(monthMatch[0])) {
      const d = new Date(todayDate);
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
      return d.toISOString().slice(0, 10);
    }
    return todayDate.toISOString().slice(0, 10);
  }

  return null;
}

export function parseAmount(text: string): number | null {
  const patterns = [
    /(\d+[.,]\d{1,2})/,
    /(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Number(match[1].replace(",", "."));
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  }

  return null;
}
