import { prisma } from "@/lib/prisma";
import { depositAddresses, featuredMarkets, sampleAccounts } from "@/lib/data";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

async function hasUsersTable() {
  try {
    await prisma.user.count();
    return true;
  } catch {
    return false;
  }
}

export async function getUserDashboardSnapshot(userId: string) {
  if (!(await hasUsersTable())) {
    return {
      user: {
        name: "Demo Trader",
        email: "trader@ethprofito.com",
        walletAddress: null,
        kycStatus: "PENDING"
      },
      balances: [
        { asset: { symbol: "BTC", name: "Bitcoin" }, amount: 1.8, lockedAmount: 0.25 },
        { asset: { symbol: "ETH", name: "Ethereum" }, amount: 14.2, lockedAmount: 2.1 },
        { asset: { symbol: "USDT", name: "Tether" }, amount: 2500, lockedAmount: 0 }
      ],
      trades: [],
      binaryOptions: [],
      depositAddresses: depositAddresses.map((item) => ({
        assetCode: item.symbol,
        network: item.chain,
        address: item.address
      })),
      depositSubmissions: []
    };
  }

  const [user, balances, trades, binaryOptions, depositAddressesDb, depositSubmissions] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          walletAddress: true,
          kycStatus: true
        }
      }),
      prisma.balance.findMany({
        where: { userId },
        include: { asset: true },
        orderBy: { asset: { symbol: "asc" } }
      }),
      prisma.trade.findMany({
        where: { userId },
        include: { asset: true },
        take: 10,
        orderBy: { createdAt: "desc" }
      }),
      prisma.binaryOptionTrade.findMany({
        where: { userId },
        include: { asset: true },
        take: 12,
        orderBy: { createdAt: "desc" }
      }),
      prisma.depositAddress.findMany({
        where: { active: true },
        orderBy: { assetCode: "asc" }
      }),
      prisma.depositSubmission.findMany({
        where: { userId },
        include: { asset: true },
        orderBy: { createdAt: "desc" },
        take: 12
      })
    ]);

  return {
    user,
    balances: balances.map((balance) => ({
      ...balance,
      amount: Number(balance.amount),
      lockedAmount: Number(balance.lockedAmount)
    })),
    trades,
    binaryOptions,
    depositAddresses: depositAddressesDb,
    depositSubmissions
  };
}

export async function getDepositPageSnapshot(userId: string) {
  if (!(await hasUsersTable())) {
    return {
      depositAddresses,
      submissions: []
    };
  }

  const [addresses, submissions] = await Promise.all([
    prisma.depositAddress.findMany({
      where: { active: true },
      orderBy: { assetCode: "asc" }
    }),
    prisma.depositSubmission.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { createdAt: "desc" },
      take: 15
    })
  ]);

  return {
    depositAddresses: addresses.map((item) => ({
      chain: item.network,
      symbol: item.assetCode,
      address: item.address,
      confirmations: item.network === "Bitcoin" ? "3 network confirmations" : "Manual review",
      note: "Upload a transaction screenshot and await admin approval before credit is released."
    })),
    submissions
  };
}

export async function getWalletSnapshot(userId: string) {
  if (!(await hasUsersTable())) {
    return {
      balances: [
        { asset: { symbol: "BTC", name: "Bitcoin" }, amount: 1.8, lockedAmount: 0.25 },
        { asset: { symbol: "ETH", name: "Ethereum" }, amount: 14.2, lockedAmount: 2.1 },
        { asset: { symbol: "USDT", name: "Tether" }, amount: 2500, lockedAmount: 0 }
      ],
      depositSubmissions: [],
      withdrawalRequests: [],
      swapOrders: [],
      addresses: depositAddresses
    };
  }

  const [balances, depositSubmissions, withdrawalRequests, swapOrders, addresses] = await Promise.all([
    prisma.balance.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { asset: { symbol: "asc" } }
    }),
    prisma.depositSubmission.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.withdrawalRequest.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.swapOrder.findMany({
      where: { userId },
      include: { fromAsset: true, toAsset: true },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.depositAddress.findMany({
      where: { active: true },
      orderBy: { assetCode: "asc" }
    })
  ]);

  return {
    balances: balances.map((balance) => ({
      ...balance,
      amount: Number(balance.amount),
      lockedAmount: Number(balance.lockedAmount)
    })),
    depositSubmissions: depositSubmissions.map((submission) => ({
      ...submission,
      amount: Number(submission.amount)
    })),
    withdrawalRequests: withdrawalRequests.map((request) => ({
      ...request,
      amount: Number(request.amount)
    })),
    swapOrders: swapOrders.map((order) => ({
      ...order,
      fromAmount: Number(order.fromAmount),
      toAmount: Number(order.toAmount),
      rate: Number(order.rate)
    })),
    addresses
  };
}

async function getFallbackAdminSnapshot() {
  return {
    users: sampleAccounts.map((account, index) => ({
      id: `sample-${index}`,
      name: account.name,
      email: account.email,
      role: index === 0 ? "ADMIN" : "USER",
      isRestricted: account.status === "Restricted",
      kycStatus: account.status === "Pending KYC" ? "PENDING" : "APPROVED",
      balances: []
    })),
    auditLogs: [],
    depositSubmissions: [],
    withdrawalRequests: [],
    binaryOptions: [],
    totals: {
      totalUsers: sampleAccounts.length,
      restrictedUsers: 1,
      pendingDeposits: 0,
      openBinaryOptions: 0,
      pendingWithdrawals: 0
    }
  };
}

export async function getAdminSnapshot() {
  if (!(await hasUsersTable())) {
    return getFallbackAdminSnapshot();
  }

  const [
    users,
    auditLogs,
    depositSubmissions,
    binaryOptions,
    withdrawalRequests,
    totalUsers,
    restrictedUsers,
    pendingDeposits,
    openBinaryOptions,
    pendingWithdrawals
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isRestricted: true,
        kycStatus: true,
        balances: {
          select: {
            id: true,
            amount: true,
            lockedAmount: true,
            asset: {
              select: {
                symbol: true
              }
            }
          },
          orderBy: { asset: { symbol: "asc" } }
        }
      }
    }),
    prisma.auditLog.findMany({
      include: {
        admin: true,
        user: true
      },
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.depositSubmission.findMany({
      include: {
        user: true,
        asset: true
      },
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.binaryOptionTrade.findMany({
      include: {
        user: true,
        asset: true
      },
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.withdrawalRequest.findMany({
      include: {
        user: true,
        asset: true
      },
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.user.count(),
    prisma.user.count({ where: { isRestricted: true } }),
    prisma.depositSubmission.count({ where: { status: "PENDING" } }),
    prisma.binaryOptionTrade.count({ where: { status: "OPEN" } }),
    prisma.withdrawalRequest.count({ where: { status: "PENDING" } })
  ]);

  return {
    users: users.map((user) => ({
      ...user,
      balances: user.balances.map((balance) => ({
        ...balance,
        amount: Number(balance.amount),
        lockedAmount: Number(balance.lockedAmount)
      }))
    })),
    auditLogs,
    depositSubmissions: depositSubmissions.map((submission) => ({
      ...submission,
      amount: Number(submission.amount)
    })),
    withdrawalRequests: withdrawalRequests.map((request) => ({
      ...request,
      amount: Number(request.amount)
    })),
    binaryOptions: binaryOptions.map((option) => ({
      ...option,
      stakeAmount: Number(option.stakeAmount),
      openingPrice: Number(option.openingPrice),
      closingPrice: option.closingPrice ? Number(option.closingPrice) : null,
      payoutAmount: option.payoutAmount ? Number(option.payoutAmount) : null
    })),
    totals: {
      totalUsers,
      restrictedUsers,
      pendingDeposits,
      openBinaryOptions,
      pendingWithdrawals
    }
  };
}

type MarketCard = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  category: string;
  source: string;
};

function toMarketCard(
  symbol: string,
  name: string,
  price: number,
  change: number,
  category: string,
  source: string
): MarketCard {
  const formattedChange = `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;

  return {
    symbol,
    name,
    price: formatMoney(price),
    change: formattedChange,
    category,
    source
  };
}

export async function getMarketCards() {
  const results: MarketCard[] = [...featuredMarkets];

  try {
    const cryptoResponse = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true",
      {
        next: { revalidate: 60 }
      }
    );

    if (cryptoResponse.ok) {
      const crypto = (await cryptoResponse.json()) as Record<
        string,
        { usd: number; usd_24h_change?: number }
      >;

      results[0] = toMarketCard(
        "BTCUSD",
        "Bitcoin",
        crypto.bitcoin?.usd ?? 0,
        crypto.bitcoin?.usd_24h_change ?? 0,
        "Crypto",
        "CoinGecko"
      );
      results[1] = toMarketCard(
        "ETHUSD",
        "Ethereum",
        crypto.ethereum?.usd ?? 0,
        crypto.ethereum?.usd_24h_change ?? 0,
        "Crypto",
        "CoinGecko"
      );
      results[5] = toMarketCard(
        "SOLUSD",
        "Solana",
        crypto.solana?.usd ?? 0,
        crypto.solana?.usd_24h_change ?? 0,
        "Crypto",
        "CoinGecko"
      );
    }
  } catch {
    // Keep fallback cards when live providers are unavailable.
  }

  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!alphaVantageKey) {
    return results;
  }

  try {
    const [appleResponse, teslaResponse, goldResponse] = await Promise.all([
      fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${alphaVantageKey}`,
        {
          next: { revalidate: 60 }
        }
      ),
      fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=TSLA&apikey=${alphaVantageKey}`,
        {
          next: { revalidate: 60 }
        }
      ),
      fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${alphaVantageKey}`,
        {
          next: { revalidate: 60 }
        }
      )
    ]);

    const apple = (await appleResponse.json()) as {
      "Global Quote"?: Record<string, string>;
    };
    const tesla = (await teslaResponse.json()) as {
      "Global Quote"?: Record<string, string>;
    };
    const gold = (await goldResponse.json()) as {
      "Realtime Currency Exchange Rate"?: Record<string, string>;
    };

    if (apple["Global Quote"]) {
      results[3] = toMarketCard(
        "NASDAQ:AAPL",
        "Apple",
        Number(apple["Global Quote"]["05. price"] ?? 0),
        Number(apple["Global Quote"]["10. change percent"]?.replace("%", "") ?? 0),
        "Stocks",
        "Alpha Vantage"
      );
    }

    if (tesla["Global Quote"]) {
      results[4] = toMarketCard(
        "NASDAQ:TSLA",
        "Tesla",
        Number(tesla["Global Quote"]["05. price"] ?? 0),
        Number(tesla["Global Quote"]["10. change percent"]?.replace("%", "") ?? 0),
        "Stocks",
        "Alpha Vantage"
      );
    }

    if (gold["Realtime Currency Exchange Rate"]) {
      results[2] = toMarketCard(
        "XAUUSD",
        "Gold Spot",
        Number(gold["Realtime Currency Exchange Rate"]["5. Exchange Rate"] ?? 0),
        0,
        "Metals",
        "Alpha Vantage"
      );
    }
  } catch {
    // Keep fallback values.
  }

  return results;
}
