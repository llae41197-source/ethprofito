import "server-only";
import { randomBytes } from "node:crypto";
import { getAddress } from "viem";

const CHALLENGE_TTL_MS = 1000 * 60 * 10;

export type WalletChallengePayload = {
  address: string;
  chainId?: number;
  nonce: string;
  issuedAt: string;
};

export function normalizeWalletAddress(address: string) {
  return getAddress(address);
}

export function createWalletChallenge(address: string, chainId?: number): WalletChallengePayload {
  return {
    address: normalizeWalletAddress(address),
    chainId,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: new Date().toISOString()
  };
}

export function createWalletMessage(payload: WalletChallengePayload) {
  return [
    "ethprofito.com wallet sign-in",
    "",
    "Sign this message to authenticate with your wallet.",
    `Address: ${payload.address}`,
    payload.chainId ? `Chain ID: ${payload.chainId}` : null,
    `Nonce: ${payload.nonce}`,
    `Issued At: ${payload.issuedAt}`
  ]
    .filter(Boolean)
    .join("\n");
}

export function isExpiredChallenge(payload: WalletChallengePayload) {
  const issuedAt = new Date(payload.issuedAt).getTime();

  if (!Number.isFinite(issuedAt)) {
    return true;
  }

  return issuedAt + CHALLENGE_TTL_MS < Date.now();
}

export function createWalletEmail(address: string) {
  return `${address.toLowerCase()}@wallet.ethprofito.local`;
}

export function createWalletDisplayName(address: string) {
  return `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`;
}
