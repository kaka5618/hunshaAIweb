import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bridalGeneratedImage,
  bridalQuizAnswer,
  bridalRecommendation,
  bridalReport,
  bridalUploadedPhoto,
} from "@/lib/db/schema";
import { BRIDAL_PROMPT_VERSION } from "@/lib/bridal/constants";
import { BRIDAL_REPORT_IMAGE_TYPES, buildBridalImagePrompt, getPlaceholderBridalImageUrl } from "@/lib/bridal/images";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { getBridalReportExpiry } from "@/lib/bridal/report";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { bridalQuizAnswersSchema } from "@/lib/bridal/validation";
import { getErrorMessage } from "@/lib/error-utils";
import { getR2PublicUrl, uploadImageFromUrl } from "@/lib/r2-storage";
import { volcanoEngine } from "@/lib/volcano-engine";

function canUseLocalImageFallback() {
  return !process.env.VOLCANO_ENGINE_API_KEY || process.env.BRIDAL_ALLOW_IMAGE_FALLBACK === "true";
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

function recommendationsExpectedCount(
  images: Array<{ recommendationId: string; type: string; generationStatus: string; errorMessage: string | null }>,
) {
  return new Set(
    images
      .filter(image => image.generationStatus === "success" && !image.errorMessage)
      .map(image => `${image.recommendationId}:${image.type}`),
  ).size;
}

export async function POST(
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
      return NextResponse.json({ error: "Report must be paid before full generation" }, { status: 402 });
    }

    const existingImages = await db
      .select()
      .from(bridalGeneratedImage)
      .where(eq(bridalGeneratedImage.reportId, report.id));

    const expectedImageCount = recommendationsExpectedCount(existingImages);
    if (expectedImageCount >= 12) {
      await db
        .update(bridalReport)
        .set({ status: "ready" })
        .where(eq(bridalReport.id, report.id));

      return NextResponse.json({
        reportId: report.id,
        status: "ready",
        imageCount: expectedImageCount,
        reused: true,
      });
    }

    const recommendations = await db
      .select()
      .from(bridalRecommendation)
      .where(eq(bridalRecommendation.reportId, report.id))
      .orderBy(bridalRecommendation.rank);

    if (recommendations.length === 0) {
      return NextResponse.json({ error: "Recommendations are required" }, { status: 400 });
    }

    const [photo] = await db
      .select({ r2Key: bridalUploadedPhoto.r2Key, processedR2Key: bridalUploadedPhoto.processedR2Key })
      .from(bridalUploadedPhoto)
      .where(eq(bridalUploadedPhoto.sessionId, report.sessionId))
      .limit(1);

    const [quiz] = await db
      .select({ answers: bridalQuizAnswer.answers })
      .from(bridalQuizAnswer)
      .where(eq(bridalQuizAnswer.sessionId, report.sessionId))
      .limit(1);
    const answers = quiz ? bridalQuizAnswersSchema.parse(quiz.answers) : undefined;
    const referenceImageUrl = photo ? getR2PublicUrl(photo.processedR2Key ?? photo.r2Key) : null;
    const providerInputImage = referenceImageUrl ? await getProviderInputImage(referenceImageUrl) : null;

    await db
      .update(bridalReport)
      .set({ status: "generating" })
      .where(eq(bridalReport.id, report.id));

    let successCount = 0;
    const allowImageFallback = canUseLocalImageFallback();

    for (const recommendation of recommendations.slice(0, 3)) {
      for (const imageType of BRIDAL_REPORT_IMAGE_TYPES) {
        const prompt = buildBridalImagePrompt(recommendation, imageType, answers);
        const imageId = randomUUID();
        let imageUrl = referenceImageUrl ?? getPlaceholderBridalImageUrl(recommendation.rank);
        let fallbackReason: string | null = null;

        try {
          if (
            process.env.VOLCANO_ENGINE_API_KEY &&
            providerInputImage &&
            (providerInputImage.startsWith("http") || providerInputImage.startsWith("data:"))
          ) {
            const result = await volcanoEngine.generateImage(prompt, {
              size: "2K",
              inputImages: [providerInputImage],
              watermark: false,
            });

            const providerUrl = result.data?.[0]?.url;
            if (providerUrl) {
              imageUrl = await uploadImageFromUrl(providerUrl, report.userId ?? report.sessionId, "image");
            }
          }
        } catch (providerError) {
          if (!allowImageFallback) {
            throw providerError;
          }

          fallbackReason = getErrorMessage(providerError, "Image provider failed, used uploaded photo fallback");
          console.warn("Bridal image provider failed, using local fallback:", fallbackReason);
        }

        try {
          await db
            .insert(bridalGeneratedImage)
            .values({
              id: imageId,
              reportId: report.id,
              recommendationId: recommendation.id,
              sessionId: report.sessionId,
              userId: report.userId,
              type: imageType,
              r2Key: imageUrl,
              generationStatus: "success",
              seedreamPrompt: prompt,
              promptVersion: BRIDAL_PROMPT_VERSION,
              errorMessage: fallbackReason,
              expiresAt: getBridalReportExpiry(),
            })
            .onConflictDoUpdate({
              target: [bridalGeneratedImage.recommendationId, bridalGeneratedImage.type],
              set: {
                r2Key: imageUrl,
                generationStatus: "success",
                seedreamPrompt: prompt,
                errorMessage: fallbackReason,
                updatedAt: new Date(),
              },
            });

          successCount += 1;
        } catch (imageError) {
          await db
            .insert(bridalGeneratedImage)
            .values({
              id: imageId,
              reportId: report.id,
              recommendationId: recommendation.id,
              sessionId: report.sessionId,
              userId: report.userId,
              type: imageType,
              generationStatus: "failed",
              seedreamPrompt: prompt,
              promptVersion: BRIDAL_PROMPT_VERSION,
              errorMessage: getErrorMessage(imageError, "Failed to generate bridal image"),
              expiresAt: getBridalReportExpiry(),
            })
            .onConflictDoUpdate({
              target: [bridalGeneratedImage.recommendationId, bridalGeneratedImage.type],
              set: {
                generationStatus: "failed",
                errorMessage: getErrorMessage(imageError, "Failed to generate bridal image"),
                updatedAt: new Date(),
              },
            });
        }
      }
    }

    await db
      .update(bridalReport)
      .set({ status: successCount > 0 ? "ready" : "failed" })
      .where(eq(bridalReport.id, report.id));

    return NextResponse.json({
      reportId: report.id,
      status: successCount > 0 ? "ready" : "failed",
      imageCount: successCount,
      placeholder: !process.env.VOLCANO_ENGINE_API_KEY,
    });
  } catch (error) {
    console.error("Failed to generate full bridal report:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to generate full bridal report") },
      { status: 500 },
    );
  }
}
