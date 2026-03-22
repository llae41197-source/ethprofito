import { execSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL ?? "";

execSync("npx prisma generate", { stdio: "inherit" });

if (databaseUrl.startsWith("postgresql://")) {
  execSync("npx prisma db push", { stdio: "inherit" });

  if (process.env.RUN_SEED_ON_BUILD === "true") {
    execSync("npx prisma db seed", { stdio: "inherit" });
  }
}

execSync("npx next build", { stdio: "inherit" });
