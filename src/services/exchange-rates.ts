export interface ChfRates {
  CHF: number;
  USD: number;
  EUR: number;
  NGN: number;
}

export interface LiveChfRates {
  rates: ChfRates;
  /** Earliest ISO date (YYYY-MM-DD) reported by the provider across quotes. */
  asOf: string;
}

const API_URL = "https://api.frankfurter.dev/v2/rates";
const QUOTES = "USD,EUR,NGN";
const TTL_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

// Last-known client fallback, used only when the rate service is unreachable.
const FALLBACK_RATES: ChfRates = {
  CHF: 1,
  USD: 0.9,
  EUR: 0.93,
  NGN: 0.00055,
};

interface FrankfurterRow {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export function getFallbackChfRates(): ChfRates {
  return { ...FALLBACK_RATES };
}

let cache: LiveChfRates & { fetchedAt: number } | null = null;
let pending: Promise<LiveChfRates> | null = null;

/**
 * Fetch CHF cross-rates for the app's currencies from Frankfurter (free,
 * keyless, CORS-open). Rates are "CHF per 1 unit" of each foreign currency.
 * Results are cached for the session (6h TTL) with in-flight dedupe.
 */
export async function fetchLatestChfRates(options?: {
  signal?: AbortSignal;
  force?: boolean;
}): Promise<LiveChfRates> {
  if (
    !options?.force &&
    cache &&
    Date.now() - cache.fetchedAt < TTL_MS
  ) {
    return { rates: cache.rates, asOf: cache.asOf };
  }

  if (pending && !options?.signal) {
    return pending;
  }

  const run = async (): Promise<LiveChfRates> => {
    const res = await fetch(`${API_URL}?base=CHF&quotes=${QUOTES}`, {
      signal: options?.signal ?? AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`exchange-rate request failed with status ${res.status}`);
    }
    const rows: FrankfurterRow[] = await res.json();

    const byQuote = new Map(rows.map((row) => [row.quote, row.rate]));
    const needed = ["USD", "EUR", "NGN"] as const;
    for (const quote of needed) {
      const rate = byQuote.get(quote);
      if (typeof rate !== "number" || rate <= 0) {
        throw new Error(`exchange-rate response is missing ${quote}`);
      }
    }

    const rates: ChfRates = {
      CHF: 1,
      USD: 1 / (byQuote.get("USD") as number),
      EUR: 1 / (byQuote.get("EUR") as number),
      NGN: 1 / (byQuote.get("NGN") as number),
    };
    const asOf = rows.map((row) => row.date).sort()[0];

    cache = { rates, asOf, fetchedAt: Date.now() };
    return { rates, asOf };
  };

  pending = run().finally(() => {
    pending = null;
  });
  return pending;
}