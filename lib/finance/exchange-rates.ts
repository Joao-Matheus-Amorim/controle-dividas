import "server-only";

type CachedRate = {
  rate: number | null;
  expiresAt: number;
};

const RATE_TTL_MS = 5 * 60 * 1000;
const rateCache = new Map<string, CachedRate>();

function normalizeCurrencyCode(currency: string) {
  return currency.trim().toUpperCase();
}

async function fetchExchangeRate(fromCurrency: string, toCurrency: string) {
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);

  if (!from || !to) {
    return null;
  }

  if (from === to) {
    return 1;
  }

  const cacheKey = `${from}-${to}`;
  const cached = rateCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.rate;
  }

  try {
    const response = await fetch(
      `https://economia.awesomeapi.com.br/json/last/${from}-${to}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      rateCache.set(cacheKey, { rate: null, expiresAt: Date.now() + RATE_TTL_MS });
      return null;
    }

    const data = (await response.json()) as Record<string, { bid?: string } | undefined>;
    const pairKey = `${from}${to}`;
    const bid = data[pairKey]?.bid;
    const rate = bid ? Number.parseFloat(bid) : Number.NaN;
    const normalizedRate = Number.isFinite(rate) && rate > 0 ? rate : null;

    rateCache.set(cacheKey, {
      rate: normalizedRate,
      expiresAt: Date.now() + RATE_TTL_MS,
    });

    return normalizedRate;
  } catch (error) {
    console.error("[currency] failed to fetch exchange rate", { from, to, error });
    rateCache.set(cacheKey, { rate: null, expiresAt: Date.now() + RATE_TTL_MS });
    return null;
  }
}

export async function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
) {
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);

  if (!Number.isFinite(amount)) {
    return null;
  }

  if (from === to) {
    return amount;
  }

  const rate = await fetchExchangeRate(from, to);
  return rate ? amount * rate : null;
}
