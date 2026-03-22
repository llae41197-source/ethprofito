import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUserSession } from "@/lib/session";

const MAX_SCREENSHOT_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await requireApiUserSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const assetSymbol = String(formData.get("assetSymbol") ?? "").trim().toUpperCase();
  const network = String(formData.get("network") ?? "").trim();
  const txHash = String(formData.get("txHash") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const screenshot = formData.get("screenshot");

  if (!assetSymbol || !network || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Asset, network, and a valid positive amount are required." },
      { status: 400 }
    );
  }

  if (!(screenshot instanceof File)) {
    return NextResponse.json({ error: "A screenshot file is required." }, { status: 400 });
  }

  if (screenshot.size > MAX_SCREENSHOT_SIZE) {
    return NextResponse.json(
      { error: "Screenshot is too large. Keep it under 2MB." },
      { status: 400 }
    );
  }

  const asset = await prisma.asset.findUnique({
    where: { symbol: assetSymbol }
  });

  if (!asset) {
    return NextResponse.json({ error: "Unsupported asset." }, { status: 404 });
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

  return NextResponse.json({
    ok: true,
    message: "Deposit proof submitted and marked pending for admin review."
  });
}
