export const depositAddresses = [
  {
    chain: "Bitcoin",
    symbol: "BTC",
    address: "bc1qwaavpprtsn9emrgtkxcxl08pmerq76xg55ugnt",
    confirmations: "3 network confirmations",
    note: "For BTC deposits only. Do not send wrapped BTC or assets from unsupported networks."
  },
  {
    chain: "Ethereum",
    symbol: "ETH",
    address: "0x1cdfeea0d2c847d66d6806dfd785fa7d1dee7b65",
    confirmations: "12 block confirmations",
    note: "Use the Ethereum mainnet. ERC-20 support should be reviewed before enabling token crediting."
  },
  {
    chain: "Solana",
    symbol: "SOL",
    address: "QdsHGq3MgXyEZy5frQeF335ukq8rvfJhBDy8qKM2kNu",
    confirmations: "32 slot confirmations",
    note: "For native SOL transfers only unless SPL token parsing is implemented."
  },
  {
    chain: "Tether USD",
    symbol: "USDT",
    address: "0x1cdfeea0d2c847d66d6806dfd785fa7d1dee7b65",
    confirmations: "ERC-20 manual review",
    note: "Send only USDT on the Ethereum network unless another token network is explicitly enabled."
  },
  {
    chain: "USD Coin",
    symbol: "USDC",
    address: "0x1cdfeea0d2c847d66d6806dfd785fa7d1dee7b65",
    confirmations: "ERC-20 manual review",
    note: "Send only USDC on the Ethereum network unless another token network is explicitly enabled."
  }
] as const;

export const platformStats = [
  { label: "Markets Routed", value: "160+", hint: "Crypto, stocks, metals, FX-ready" },
  { label: "Custody Controls", value: "24/7", hint: "Admin approvals, holds, ledger notes" },
  { label: "Execution Mode", value: "<120ms", hint: "Starter UX with real-time data hooks" }
] as const;

export const featuredMarkets: MarketCard[] = [
  {
    symbol: "BTCUSD",
    name: "Bitcoin",
    price: "$84,320",
    change: "+3.4%",
    category: "Crypto",
    source: "Fallback"
  },
  {
    symbol: "ETHUSD",
    name: "Ethereum",
    price: "$4,180",
    change: "+1.9%",
    category: "Crypto",
    source: "Fallback"
  },
  {
    symbol: "XAUUSD",
    name: "Gold Spot",
    price: "$2,488",
    change: "+0.6%",
    category: "Metals",
    source: "Fallback"
  },
  {
    symbol: "NASDAQ:AAPL",
    name: "Apple",
    price: "$214.54",
    change: "+0.8%",
    category: "Stocks",
    source: "Fallback"
  },
  {
    symbol: "NASDAQ:TSLA",
    name: "Tesla",
    price: "$197.32",
    change: "-0.9%",
    category: "Stocks",
    source: "Fallback"
  },
  {
    symbol: "SOLUSD",
    name: "Solana",
    price: "$162.12",
    change: "+1.4%",
    category: "Crypto",
    source: "Fallback"
  }
];

export const sampleAccounts = [
  {
    name: "Ava Brooks",
    email: "ava@ethprofito.com",
    tier: "Prime",
    equity: "$218,440",
    exposure: "$145,200",
    status: "Active"
  },
  {
    name: "Liam Chen",
    email: "liam@ethprofito.com",
    tier: "Growth",
    equity: "$74,110",
    exposure: "$26,580",
    status: "Pending KYC"
  },
  {
    name: "Nora Patel",
    email: "nora@ethprofito.com",
    tier: "VIP",
    equity: "$491,004",
    exposure: "$302,160",
    status: "Restricted"
  }
] as const;

export const adminActions = [
  "Approve or reject deposit credit requests",
  "Adjust internal wallet balances with audit logs",
  "Freeze accounts and set withdrawal holds",
  "Review trade tickets, fees, and PnL history",
  "Control market visibility and supported instruments"
] as const;

export const binaryOptionRules = [
  { durationSeconds: 30, payoutPercent: 30, minimumStake: 300 },
  { durationSeconds: 60, payoutPercent: 40, minimumStake: 5000 },
  { durationSeconds: 90, payoutPercent: 50, minimumStake: 20000 },
  { durationSeconds: 120, payoutPercent: 60, minimumStake: 50000 },
  { durationSeconds: 300, payoutPercent: 70, minimumStake: 100000 }
] as const;

export const binaryDurations = binaryOptionRules.map((rule) => rule.durationSeconds) as readonly number[];

export const binaryPayoutPercents = binaryOptionRules.map((rule) => rule.payoutPercent) as readonly number[];
type MarketCard = {
  symbol: string;
  name: string;
  price: string;
  change: string;
  category: string;
  source: string;
};
