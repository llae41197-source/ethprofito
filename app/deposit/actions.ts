"use server";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

const MAX_SCREENSHOT_SIZE = 2 * 1024 * 1024;

export type DepositFormState = {
  error?: string;
  success?: string;
};

export async function submitDepositProof(
  _previousState: DepositFormState,
  formData: FormData
): Promise<DepositFormState> {
  const session = await requireUserSession();
  const assetSymbol = String(formData.get("assetSymbol") ?? "").trim().toUpperCase();
  const network = String(formData.get("network") ?? "").trim();
  const txHash = String(formData.get("txHash") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const screenshot = formData.get("screenshot");

  if (!assetSymbol || !network || !Number.isFinite(amount) || amount <= 0) {
    return {
      error: "Asset, network, and a valid positive amount are required."
    };
  }

  if (!(screenshot instanceof File)) {
    return {
      error: "A screenshot file is required."
    };
  }

  if (screenshot.size > MAX_SCREENSHOT_SIZE) {
    return {
      error: "Screenshot is too large. Keep it under 2MB."
    };
  }

  const asset = await prisma.asset.findUnique({
    where: { symbol: assetSymbol }
  });

  if (!asset) {
    return {
      error: "Unsupported asset."
    };
  }

  const bytes = Buffer.from(await screenshot.arrayBuffer());
  const screenshotData = `data:${screenshot.type};base64,${bytes.toString("base64")}`;

  await prisma.depositSubmission.create({
    data: {
      userId: session.id,
      assetId: asset.id,
      network,
      txHash: txHash || null,
      amount,
      screenshotName: screenshot.name,
      screenshotData,
      note: note || null,
      status: "PENDING"
    }
  });

  revalidatePath("/deposit");
  revalidatePath("/admin");

  return {
    success: "Deposit proof submitted and marked pending for admin review."
  };
}
