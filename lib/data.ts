export const depositAddresses = [
  {
    chain: "Bitcoin",
    symbol: "BTC",
    address: "bc1qhywf8l6e47e5myypr3ywu7wn2thh7fldvc0gqf",
    confirmations: "3 network confirmations",
    note: "For BTC deposits only. Do not send wrapped BTC or assets from unsupported networks."
  },
  {
    chain: "Ethereum",
    symbol: "ETH",
    address: "0x2cA2A89b0242ac1D85453F2259c821Ff37b1e3E3",
    confirmations: "12 block confirmations",
    note: "Use the Ethereum mainnet. ERC-20 support should be reviewed before enabling token crediting."
  },
  {
    chain: "Solana",
    symbol: "SOL",
    address: "HWgfhJRBX5Ne7xh2PaSy2yVQxZJ1m3LzBiu1zxCUvobw",
    confirmations: "32 slot confirmations",
    note: "For native SOL transfers only unless SPL token parsing is implemented."
  }
] as const;

export const platformStats = [
  { label: "Markets Routed", value: "160+", hint: "Crypto, stocks, metals, FX-ready" },
  { label: "Custody Controls", value: "24/7", hint: "Admin approvals, holds, ledger notes" },
  { label: "Execution Mode", value: "<120ms", hint: "Starter UX with real-time data hooks" }
] as const;

export const featuredMarkets = [
  { symbol: "BTCUSD", name: "Bitcoin", price: "$84,320", change: "+3.4%", category: "Crypto" },
  { symbol: "ETHUSD", name: "Ethereum", price: "$4,180", change: "+1.9%", category: "Crypto" },
  { symbol: "XAUUSD", name: "Gold Spot", price: "$2,488", change: "+0.6%", category: "Metals" },
  { symbol: "NASDAQ:AAPL", name: "Apple", price: "$214.54", change: "+0.8%", category: "Stocks" },
  { symbol: "NASDAQ:TSLA", name: "Tesla", price: "$197.32", change: "-0.9%", category: "Stocks" },
  { symbol: "AMEX:SPY", name: "S&P 500 ETF", price: "$589.42", change: "+0.4%", category: "Index" }
] as const;

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
