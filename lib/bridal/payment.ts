import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bridalPayment, bridalReport } from "@/lib/db/schema";
import type { CreemReturnUrlPayload } from "@/lib/payments/creem";

type BridalReportRow = typeof bridalReport.$inferSelect;

type UnlockFromCreemReturnParams = {
  report: BridalReportRow;
  payload: CreemReturnUrlPayload | null;
};

export async function unlockBridalReportFromCreemReturn({
  report,
  payload,
}: UnlockFromCreemReturnParams): Promise<BridalReportRow> {
  if (
    report.isPaid ||
    !report.userId ||
    !payload?.requestId ||
    payload.requestId !== `bridal-report:${report.id}`
  ) {
    return report;
  }

  const paymentId = payload.orderId ?? payload.checkoutId ?? `creem-return:${report.id}`;
  const paidAt = new Date();

  await db.transaction(async tx => {
    await tx
      .update(bridalReport)
      .set({ isPaid: true, status: "paid" })
      .where(eq(bridalReport.id, report.id));

    await tx
      .insert(bridalPayment)
      .values({
        id: paymentId,
        userId: report.userId as string,
        sessionId: report.sessionId,
        reportId: report.id,
        provider: "creem",
        amountCents: report.priceCents,
        currency: report.currency,
        status: "paid",
        creemCheckoutId: payload.checkoutId,
        creemPaymentId: paymentId,
        raw: JSON.stringify({ source: "return_url", ...payload }).slice(0, 65000),
        paidAt,
      })
      .onConflictDoUpdate({
        target: bridalPayment.creemPaymentId,
        set: {
          status: "paid",
          creemCheckoutId: payload.checkoutId,
          paidAt,
          raw: JSON.stringify({ source: "return_url", ...payload }).slice(0, 65000),
        },
      });
  });

  return {
    ...report,
    isPaid: true,
    status: "paid",
    updatedAt: paidAt,
  };
}
