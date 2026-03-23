import "server-only";

const fallbackRatesToUsd: Record<string, number> = {
  BTC: 84320,
  ETH: 4180,
  SOL: 162.12,
  USDT: 1,
  XAU: 2488
};

const coingeckoIds: Partial<Record<string, string>> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  USDT: "tether"
};

export async function getUsdQuote(symbol: string) {
  const upper = symbol.trim().toUpperCase();

  if (upper === "USDT") {
    return { price: 1, source: "Fixed USD peg" };
  }

  const coingeckoId = coingeckoIds[upper];

  if (coingeckoId) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
        {
          cache: "no-store"
        }
      );

      if (response.ok) {
        const data = (await response.json()) as Record<string, { usd?: number }>;
        const price = Number(data[coingeckoId]?.usd ?? 0);

        if (price > 0) {
          return { price, source: "CoinGecko" };
        }
      }
    } catch {
      // Use fallback below.
    }
  }

  if (upper === "XAU" && process.env.ALPHA_VANTAGE_API_KEY) {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
        {
          cache: "no-store"
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          "Realtime Currency Exchange Rate"?: Record<string, string>;
        };
        const price = Number(
          data["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"] ?? 0
        );

        if (price > 0) {
          return { price, source: "Alpha Vantage" };
        }
      }
    } catch {
      // Use fallback below.
    }
  }

  const fallback = fallbackRatesToUsd[upper];
  return fallback ? { price: fallback, source: "Fallback" } : null;
}
