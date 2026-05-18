import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bridalGeneratedImage, bridalRecommendation, bridalReport } from "@/lib/db/schema";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { getErrorMessage } from "@/lib/error-utils";

const EXPECTED_IMAGE_COUNT = 12;

function countCleanSuccessImages(
  images: Array<{ recommendationId: string; type: string; generationStatus: string; errorMessage: string | null }>,
) {
  return new Set(
    images
      .filter(image => image.generationStatus === "success" && !image.errorMessage)
      .map(image => `${image.recommendationId}:${image.type}`),
  ).size;
}

function countFailedImages(
  images: Array<{ recommendationId: string; type: string; generationStatus: string }>,
) {
  return new Set(
    images
      .filter(image => image.generationStatus === "failed")
      .map(image => `${image.recommendationId}:${image.type}`),
  ).size;
}

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

    const images = await db
      .select({
        recommendationId: bridalGeneratedImage.recommendationId,
        type: bridalGeneratedImage.type,
        generationStatus: bridalGeneratedImage.generationStatus,
        errorMessage: bridalGeneratedImage.errorMessage,
      })
      .from(bridalGeneratedImage)
      .where(eq(bridalGeneratedImage.reportId, report.id));

    return NextResponse.json({
      reportId: report.id,
      status: report.status,
      isPaid: report.isPaid,
      priceCents: report.priceCents,
      currency: report.currency,
      expiresAt: report.expiresAt.toISOString(),
      recommendationCount: recommendationCount.length,
      imageProgress: {
        success: countCleanSuccessImages(images),
        failed: countFailedImages(images),
        total: EXPECTED_IMAGE_COUNT,
      },
    });
  } catch (error) {
    console.error("Failed to read bridal report status:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to read report status") },
      { status: 500 },
    );
  }
}
