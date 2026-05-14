import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bridalRecommendation, bridalReport } from "@/lib/db/schema";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { getErrorMessage } from "@/lib/error-utils";

export async function GET(
  _request: Request,
  props: {
    params: Promise<{ reportId: string }>;
  },
) {
  try {
    const { reportId } = await props.params;
    const sessionId = await getBridalSessionIdFromCookies();

    const [report] = await db
      .select({
        id: bridalReport.id,
        sessionId: bridalReport.sessionId,
        userId: bridalReport.userId,
        status: bridalReport.status,
        isPaid: bridalReport.isPaid,
        priceCents: bridalReport.priceCents,
        currency: bridalReport.currency,
        expiresAt: bridalReport.expiresAt,
      })
      .from(bridalReport)
      .where(eq(bridalReport.id, reportId))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!canAccessBridalResource({ sessionId, resource: report })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const recommendationCount = await db
      .select({ id: bridalRecommendation.id })
      .from(bridalRecommendation)
      .where(eq(bridalRecommendation.reportId, report.id));

    return NextResponse.json({
      reportId: report.id,
      status: report.status,
      isPaid: report.isPaid,
      priceCents: report.priceCents,
      currency: report.currency,
      expiresAt: report.expiresAt.toISOString(),
      recommendationCount: recommendationCount.length,
    });
  } catch (error) {
    console.error("Failed to read bridal report status:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to read report status") },
      { status: 500 },
    );
  }
}
