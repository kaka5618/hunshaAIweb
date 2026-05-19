import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bridalGeneratedImage,
  bridalQuizAnswer,
  bridalRecommendation,
  bridalReport,
  bridalUploadedPhoto,
} from "@/lib/db/schema";
import {
  BRIDAL_PROMPT_VERSION,
  BRIDAL_REPORT_CURRENCY,
  BRIDAL_REPORT_PRICE_CENTS,
} from "@/lib/bridal/constants";
import { generateBridalRecommendations } from "@/lib/bridal/deepseek";
import { buildBridalImagePrompt } from "@/lib/bridal/images";
import { getBridalReportExpiry } from "@/lib/bridal/report";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { bridalQuizAnswersSchema } from "@/lib/bridal/validation";
import { getErrorMessage } from "@/lib/error-utils";
import { getR2PublicUrl, uploadImageFromUrl } from "@/lib/r2-storage";
import { volcanoEngine } from "@/lib/volcano-engine";
import type { BridalReportLanguage } from "@/lib/bridal/types";

function parseReportLanguage(value: unknown): BridalReportLanguage {
  return value === "zh" ? "zh" : "en";
}

async function getProviderInputImage(imageUrl: string) {
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }

  if (!imageUrl.startsWith("http")) {
    return imageUrl;
  }

  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to load bridal reference image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());

  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export async function POST(request: Request) {
  let reportId: string | null = null;

  try {
    const body = (await request.json().catch(() => null)) as { locale?: unknown } | null;
    const locale = parseReportLanguage(body?.locale);
    const sessionId = await getBridalSessionIdFromCookies();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Bridal session is required" },
        { status: 401 },
      );
    }

    const [quiz] = await db
      .select()
      .from(bridalQuizAnswer)
      .where(eq(bridalQuizAnswer.sessionId, sessionId))
      .orderBy(desc(bridalQuizAnswer.updatedAt))
      .limit(1);

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz answers are required before generating a report" },
        { status: 400 },
      );
    }

    const [photo] = await db
      .select({
        id: bridalUploadedPhoto.id,
        r2Key: bridalUploadedPhoto.r2Key,
        processedR2Key: bridalUploadedPhoto.processedR2Key,
        createdAt: bridalUploadedPhoto.createdAt,
      })
      .from(bridalUploadedPhoto)
      .where(eq(bridalUploadedPhoto.sessionId, sessionId))
      .orderBy(desc(bridalUploadedPhoto.createdAt))
      .limit(1);

    if (!photo) {
      return NextResponse.json(
        { error: "A bridal photo is required before generating a report" },
        { status: 400 },
      );
    }

    const [existingReport] = await db
      .select({
        id: bridalReport.id,
        status: bridalReport.status,
        createdAt: bridalReport.createdAt,
      })
      .from(bridalReport)
      .where(
        and(
          eq(bridalReport.sessionId, sessionId),
          ne(bridalReport.status, "failed"),
          ne(bridalReport.status, "expired"),
        ),
      )
      .orderBy(desc(bridalReport.createdAt))
      .limit(1);

    if (
      existingReport &&
      existingReport.createdAt >= quiz.updatedAt &&
      existingReport.createdAt >= photo.createdAt
    ) {
      return NextResponse.json({
        reportId: existingReport.id,
        status: existingReport.status,
        reused: true,
      });
    }

    const answers = bridalQuizAnswersSchema.parse(quiz.answers);
    reportId = randomUUID();

    await db.insert(bridalReport).values({
      id: reportId,
      sessionId,
      status: "generating_preview",
      priceCents: BRIDAL_REPORT_PRICE_CENTS,
      currency: BRIDAL_REPORT_CURRENCY,
      expiresAt: getBridalReportExpiry(),
    });

    const recommendations = await generateBridalRecommendations(answers, { locale });
    const recommendationRows = recommendations.map(recommendation => ({
      id: randomUUID(),
      reportId: reportId as string,
      sessionId,
      rank: recommendation.rank,
      styleName: recommendation.styleName,
      silhouette: recommendation.silhouette,
      neckline: recommendation.neckline,
      fabric: recommendation.fabric,
      venueMatch: recommendation.venueMatch,
      whyItWorks: recommendation.whyItWorks,
      whatToAvoid: recommendation.whatToAvoid,
      budgetMin: recommendation.budgetMin,
      budgetMax: recommendation.budgetMax,
      budgetGuardrail: recommendation.budgetGuardrail,
      tryFirst: recommendation.tryFirst,
      skipFirst: recommendation.skipFirst,
      consultantScript: recommendation.consultantScript,
      salesPressureReminder: recommendation.salesPressureReminder,
      detailCaptions: recommendation.detailCaptions,
    }));

    await db.insert(bridalRecommendation).values(recommendationRows);

    const leadingRecommendation = recommendationRows.find(recommendation => recommendation.rank === 1) ?? recommendationRows[0];
    if (!leadingRecommendation) {
      throw new Error("At least one bridal recommendation is required");
    }

    const referenceImageUrl = getR2PublicUrl(photo.processedR2Key ?? photo.r2Key);
    const providerInputImage = await getProviderInputImage(referenceImageUrl);
    const previewPrompt = buildBridalImagePrompt(leadingRecommendation, "full_body", answers);
    const previewImageId = randomUUID();
    const previewResult = await volcanoEngine.generateImage(previewPrompt, {
      model: "doubao-seedream-5-0-260128",
      size: "2K",
      inputImages: [providerInputImage],
      watermark: false,
    });

    const providerUrl = previewResult.data?.[0]?.url;
    if (!providerUrl) {
      throw new Error("Preview bridal image provider response did not include an image URL");
    }

    const previewImageUrl = await uploadImageFromUrl(providerUrl, sessionId, "image");

    await db.insert(bridalGeneratedImage).values({
      id: previewImageId,
      reportId: reportId as string,
      recommendationId: leadingRecommendation.id,
      sessionId,
      type: "full_body",
      r2Key: previewImageUrl,
      generationStatus: "success",
      seedreamPrompt: previewPrompt,
      promptVersion: BRIDAL_PROMPT_VERSION,
      expiresAt: getBridalReportExpiry(),
    });

    await db
      .update(bridalReport)
      .set({ status: "preview_ready" })
      .where(eq(bridalReport.id, reportId));

    return NextResponse.json({
      reportId,
      status: "preview_ready",
      reused: false,
    });
  } catch (error) {
    if (reportId) {
      await db
        .update(bridalReport)
        .set({ status: "failed" })
        .where(eq(bridalReport.id, reportId))
        .catch(() => undefined);
    }

    console.error("Failed to generate bridal preview:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to generate bridal preview") },
      { status: 500 },
    );
  }
}
