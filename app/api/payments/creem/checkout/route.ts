import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isPackKey, isSubscriptionKey, oneTimePacks, subscriptionPlans } from "@/constants/billing";
import { createCheckoutSession } from "@/lib/payments/creem";
import { getActiveSessionUser } from "@/lib/auth/session";
import { getErrorMessage } from "@/lib/error-utils";
import { BRIDAL_REPORT_PRODUCT_TYPE } from "@/lib/bridal/constants";
import { db } from "@/lib/db";
import { bridalReport } from "@/lib/db/schema";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";

type Body = {
  kind: "subscription" | "one_time";
  key: string; // plan or pack key
  reportId?: string;
  locale?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { kind, key, reportId, locale } = body;

    // Get user from Better Auth session (do not trust client userId)
    const access = await getActiveSessionUser(req.headers);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const userId = access.user.id;

    let creemPriceId: string | undefined;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.yourbridalstyle.com";
    let successUrl = `${appUrl}/dashboard?success=1&product=${key}`;
    let cancelUrl = `${appUrl}/pricing`;
    const checkoutMetadata: Record<string, string> = {};

    if (kind === "subscription") {
      if (!isSubscriptionKey(key)) {
        return NextResponse.json({ error: "Invalid subscription key" }, { status: 400 });
      }
      const plan = subscriptionPlans[key];
      creemPriceId = plan.creemPriceId;
    } else if (kind === "one_time") {
      if (!isPackKey(key)) {
        return NextResponse.json({ error: "Invalid pack key" }, { status: 400 });
      }
      const pack = oneTimePacks[key];
      creemPriceId = pack.creemPriceId;

      if (key === "bridal_report") {
        if (!reportId) {
          return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
        }

        const [report] = await db
          .select()
          .from(bridalReport)
          .where(eq(bridalReport.id, reportId))
          .limit(1);

        const sessionId = await getBridalSessionIdFromCookies();
        if (!report || !canAccessBridalResource({ currentUserId: userId, sessionId, resource: report })) {
          return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        await db
          .update(bridalReport)
          .set({
            userId,
            status: report.isPaid ? report.status : "awaiting_payment",
          })
          .where(eq(bridalReport.id, reportId));

        const localePrefix = locale === "zh" || locale === "en" ? `/${locale}` : "";
        successUrl = `${appUrl}${localePrefix}/report/${reportId}?success=1`;
        cancelUrl = `${appUrl}${localePrefix}/report/${reportId}`;
        checkoutMetadata.productType = BRIDAL_REPORT_PRODUCT_TYPE;
        checkoutMetadata.reportId = reportId;
      }
    } else {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }

    const { url } = await createCheckoutSession({
      userId,
      key,
      kind,
      successUrl,
      cancelUrl,
      creemPriceId,
      customerEmail: access.user.email,
      metadata: Object.keys(checkoutMetadata).length > 0 ? checkoutMetadata : undefined,
      requestId: reportId ? `bridal-report:${reportId}` : undefined,
    });

    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error("Creem checkout error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Server error") },
      { status: 500 }
    );
  }
}
