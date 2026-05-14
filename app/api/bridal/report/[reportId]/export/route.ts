import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bridalGeneratedImage, bridalRecommendation, bridalReport } from "@/lib/db/schema";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { buildBridalReportHtml } from "@/lib/bridal/report-html";
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
      .select()
      .from(bridalReport)
      .where(eq(bridalReport.id, reportId))
      .limit(1);

    if (!report || !canAccessBridalResource({ sessionId, resource: report })) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!report.isPaid) {
      return NextResponse.json({ error: "Report must be paid before export" }, { status: 402 });
    }

    const recommendations = await db
      .select()
      .from(bridalRecommendation)
      .where(eq(bridalRecommendation.reportId, report.id))
      .orderBy(bridalRecommendation.rank);

    const images = await db
      .select({
        recommendationId: bridalGeneratedImage.recommendationId,
        r2Key: bridalGeneratedImage.r2Key,
      })
      .from(bridalGeneratedImage)
      .where(eq(bridalGeneratedImage.reportId, report.id));

    const html = buildBridalReportHtml({
      title: report.title,
      generatedAt: report.updatedAt,
      recommendations,
      images,
    });

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `inline; filename="bridal-report-${report.id}.html"`,
      },
    });
  } catch (error) {
    console.error("Failed to export bridal report:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to export bridal report") },
      { status: 500 },
    );
  }
}
