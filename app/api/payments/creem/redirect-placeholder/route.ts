import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { BRIDAL_REPORT_PRODUCT_TYPE } from "@/lib/bridal/constants";
import { db } from "@/lib/db";
import { bridalPayment, bridalReport } from "@/lib/db/schema";

function getSafeRedirectUrl(value: string | null, fallback: string, appUrl: string) {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = new URL(value, appUrl);
    const allowedOrigin = new URL(appUrl).origin;
    if (parsed.origin !== allowedOrigin) {
      return fallback;
    }

    return parsed.toString();
  } catch {
    return fallback;
  }
}

async function markSimulatedBridalReportPaid(url: URL) {
  const productType = url.searchParams.get("productType");
  const reportId = url.searchParams.get("reportId");
  const userId = url.searchParams.get("userId");

  if (productType !== BRIDAL_REPORT_PRODUCT_TYPE || !reportId || !userId) {
    return;
  }

  const [report] = await db
    .select()
    .from(bridalReport)
    .where(eq(bridalReport.id, reportId))
    .limit(1);

  if (!report) {
    return;
  }

  const simulatedPaymentId = `simulated:${reportId}`;
  const paidAt = new Date();

  await db
    .update(bridalReport)
    .set({
      userId,
      isPaid: true,
      status: "paid",
    })
    .where(eq(bridalReport.id, reportId));

  await db
    .insert(bridalPayment)
    .values({
      id: randomUUID(),
      userId,
      sessionId: report.sessionId,
      reportId,
      provider: "creem",
      amountCents: report.priceCents,
      currency: report.currency,
      status: "paid",
      creemCheckoutId: simulatedPaymentId,
      creemPaymentId: simulatedPaymentId,
      raw: JSON.stringify({ simulated: true, query: Object.fromEntries(url.searchParams) }),
      paidAt,
    })
    .onConflictDoUpdate({
      target: bridalPayment.creemPaymentId,
      set: {
        status: "paid",
        paidAt,
        raw: JSON.stringify({ simulated: true, query: Object.fromEntries(url.searchParams) }),
      },
    });
}

// Local-only placeholder used when CREEM_SIMULATE=true to emulate a successful checkout redirect.
export async function GET(req: NextRequest) {
  if (process.env.CREEM_SIMULATE !== "true") {
    return NextResponse.json({ error: "Creem simulation is disabled" }, { status: 404 });
  }

  const url = new URL(req.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yourbridalstyle.com";
  const success = url.searchParams.get("success") || "1";
  const fallback = `${appUrl}/dashboard?success=${success}`;
  const successUrl = getSafeRedirectUrl(url.searchParams.get("successUrl"), fallback, appUrl);
  const cancelUrl = getSafeRedirectUrl(url.searchParams.get("cancelUrl"), fallback, appUrl);
  const redirectTo = success === "1" ? successUrl : cancelUrl;

  if (success === "1") {
    await markSimulatedBridalReportPaid(url);
  }

  return NextResponse.redirect(redirectTo);
}

export const dynamic = "force-dynamic";
