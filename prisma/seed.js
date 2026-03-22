const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const [btc, eth, sol, gold, apple] = await Promise.all([
    prisma.asset.upsert({
      where: { symbol: "BTC" },
      update: {},
      create: { symbol: "BTC", name: "Bitcoin", assetClass: "CRYPTO" }
    }),
    prisma.asset.upsert({
      where: { symbol: "ETH" },
      update: {},
      create: { symbol: "ETH", name: "Ethereum", assetClass: "CRYPTO" }
    }),
    prisma.asset.upsert({
      where: { symbol: "SOL" },
      update: {},
      create: { symbol: "SOL", name: "Solana", assetClass: "CRYPTO" }
    }),
    prisma.asset.upsert({
      where: { symbol: "XAU" },
      update: {},
      create: { symbol: "XAU", name: "Gold", assetClass: "METAL" }
    }),
    prisma.asset.upsert({
      where: { symbol: "AAPL" },
      update: {},
      create: { symbol: "AAPL", name: "Apple", assetClass: "STOCK" }
    })
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ethprofito.com" },
    update: { role: "ADMIN", name: "Platform Admin", kycStatus: "APPROVED" },
    create: {
      email: "admin@ethprofito.com",
      name: "Platform Admin",
      role: "ADMIN",
      kycStatus: "APPROVED"
    }
  });

  const trader = await prisma.user.upsert({
    where: { email: "trader@ethprofito.com" },
    update: { name: "Demo Trader", kycStatus: "APPROVED" },
    create: {
      email: "trader@ethprofito.com",
      name: "Demo Trader",
      kycStatus: "APPROVED"
    }
  });

  await Promise.all([
    prisma.depositAddress.upsert({
      where: { address: "bc1qhywf8l6e47e5myypr3ywu7wn2thh7fldvc0gqf" },
      update: { active: true },
      create: {
        assetId: btc.id,
        assetCode: "BTC",
        network: "Bitcoin",
        address: "bc1qhywf8l6e47e5myypr3ywu7wn2thh7fldvc0gqf"
      }
    }),
    prisma.depositAddress.upsert({
      where: { address: "0x2cA2A89b0242ac1D85453F2259c821Ff37b1e3E3" },
      update: { active: true },
      create: {
        assetId: eth.id,
        assetCode: "ETH",
        network: "Ethereum",
        address: "0x2cA2A89b0242ac1D85453F2259c821Ff37b1e3E3"
      }
    }),
    prisma.depositAddress.upsert({
      where: { address: "HWgfhJRBX5Ne7xh2PaSy2yVQxZJ1m3LzBiu1zxCUvobw" },
      update: { active: true },
      create: {
        assetId: sol.id,
        assetCode: "SOL",
        network: "Solana",
        address: "HWgfhJRBX5Ne7xh2PaSy2yVQxZJ1m3LzBiu1zxCUvobw"
      }
    })
  ]);

  await Promise.all([
    prisma.balance.upsert({
      where: { userId_assetId: { userId: trader.id, assetId: btc.id } },
      update: { amount: 1.8, lockedAmount: 0.25 },
      create: { userId: trader.id, assetId: btc.id, amount: 1.8, lockedAmount: 0.25 }
    }),
    prisma.balance.upsert({
      where: { userId_assetId: { userId: trader.id, assetId: eth.id } },
      update: { amount: 14.2, lockedAmount: 2.1 },
      create: { userId: trader.id, assetId: eth.id, amount: 14.2, lockedAmount: 2.1 }
    }),
    prisma.balance.upsert({
      where: { userId_assetId: { userId: trader.id, assetId: gold.id } },
      update: { amount: 55, lockedAmount: 10 },
      create: { userId: trader.id, assetId: gold.id, amount: 55, lockedAmount: 10 }
    })
  ]);

  await prisma.trade.create({
    data: {
      userId: trader.id,
      assetId: apple.id,
      marketSymbol: "NASDAQ:AAPL",
      side: "BUY",
      quantity: 20,
      entryPrice: 213.44,
      executionPrice: 214.04,
      feeAmount: 3.5,
      status: "FILLED"
    }
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      userId: trader.id,
      action: "BALANCE_ADJUSTMENT_APPROVED",
      targetType: "BALANCE",
      meta: JSON.stringify({
        asset: "BTC",
        amount: 0.35,
        notes: "Manual credit after reviewed deposit."
      })
    }
  });

  await prisma.ledgerEntry.create({
    data: {
      userId: trader.id,
      assetId: btc.id,
      type: "DEPOSIT",
      amount: 0.35,
      reference: "demo-tx-001",
      notes: "Seed deposit entry"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
