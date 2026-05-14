import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bridalGeneratedImage,
  bridalRecommendation,
  bridalReport,
  bridalUploadedPhoto,
} from "@/lib/db/schema";
import { BRIDAL_PROMPT_VERSION } from "@/lib/bridal/constants";
import { buildBridalImagePrompt, getPlaceholderBridalImageUrl } from "@/lib/bridal/images";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { getBridalReportExpiry } from "@/lib/bridal/report";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { getErrorMessage } from "@/lib/error-utils";
import { uploadImageFromUrl } from "@/lib/r2-storage";
import { volcanoEngine } from "@/lib/volcano-engine";

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

    if (existingImages.some(image => image.generationStatus === "success")) {
      await db
        .update(bridalReport)
        .set({ status: "ready" })
        .where(eq(bridalReport.id, report.id));

      return NextResponse.json({
        reportId: report.id,
        status: "ready",
        imageCount: existingImages.filter(image => image.generationStatus === "success").length,
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
      .select({ r2Key: bridalUploadedPhoto.r2Key })
      .from(bridalUploadedPhoto)
      .where(eq(bridalUploadedPhoto.sessionId, report.sessionId))
      .limit(1);

    await db
      .update(bridalReport)
      .set({ status: "generating" })
      .where(eq(bridalReport.id, report.id));

    let successCount = 0;

    for (const recommendation of recommendations.slice(0, 3)) {
      const prompt = buildBridalImagePrompt(recommendation);
      const imageId = randomUUID();
      let imageUrl = getPlaceholderBridalImageUrl(recommendation.rank);

      try {
        if (
          process.env.VOLCANO_ENGINE_API_KEY &&
          photo?.r2Key &&
          (photo.r2Key.startsWith("http") || photo.r2Key.startsWith("data:"))
        ) {
          const result = await volcanoEngine.generateImage(prompt, {
            size: "1K",
            inputImages: [photo.r2Key],
            watermark: false,
          });

          const providerUrl = result.data?.[0]?.url;
          if (providerUrl) {
            imageUrl = await uploadImageFromUrl(providerUrl, report.userId ?? report.sessionId, "image");
          }
        }

        await db
          .insert(bridalGeneratedImage)
          .values({
            id: imageId,
            reportId: report.id,
            recommendationId: recommendation.id,
            sessionId: report.sessionId,
            userId: report.userId,
            type: "full_body",
            r2Key: imageUrl,
            generationStatus: "success",
            seedreamPrompt: prompt,
            promptVersion: BRIDAL_PROMPT_VERSION,
            expiresAt: getBridalReportExpiry(),
          })
          .onConflictDoUpdate({
            target: [bridalGeneratedImage.recommendationId, bridalGeneratedImage.type],
            set: {
              r2Key: imageUrl,
              generationStatus: "success",
              seedreamPrompt: prompt,
              errorMessage: null,
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
            type: "full_body",
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
