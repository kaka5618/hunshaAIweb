import { randomUUID } from "crypto";
import { after, NextResponse } from "next/server";
import { and, desc, eq, lte } from "drizzle-orm";
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

const TOTAL_IMAGE_COUNT = 12;
const REQUIRED_PRIMARY_IMAGE_COUNT = 3;
const PRIMARY_IMAGE_CONCURRENCY = 3;
const DETAIL_IMAGE_CONCURRENCY = 2;
const IMAGE_GENERATION_TIMEOUT_MS = 180000;
const PRIMARY_IMAGE_TYPES = ["full_body"] as const;
const DETAIL_IMAGE_TYPES = BRIDAL_REPORT_IMAGE_TYPES.filter(type => type !== "full_body");

function recommendationsExpectedCount(
  images: Array<{ recommendationId: string; type: string; generationStatus: string; errorMessage: string | null }>,
) {
  return new Set(
    images
      .filter(image => image.generationStatus === "success" && !image.errorMessage)
      .map(image => `${image.recommendationId}:${image.type}`),
  ).size;
}

function countImageProgress(
  images: Array<{ recommendationId: string; type: string; generationStatus: string; errorMessage: string | null }>,
) {
  const success = recommendationsExpectedCount(images.filter(image => image.type === "full_body"));
  const failed = new Set(
    images
      .filter(image => image.type === "full_body" && image.generationStatus === "failed")
      .map(image => `${image.recommendationId}:${image.type}`),
  ).size;

  return {
    success,
    failed,
    total: REQUIRED_PRIMARY_IMAGE_COUNT,
  };
}

function countAllImageProgress(
  images: Array<{ recommendationId: string; type: string; generationStatus: string; errorMessage: string | null }>,
) {
  const success = recommendationsExpectedCount(images);
  const failed = new Set(
    images
      .filter(image => image.generationStatus === "failed")
      .map(image => `${image.recommendationId}:${image.type}`),
  ).size;

  return {
    success,
    failed,
    total: TOTAL_IMAGE_COUNT,
  };
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await worker(item);
    }
  });

  await Promise.all(workers);
}

async function settleReportAfterGenerationError(reportId: string) {
  const images = await db
    .select({
      recommendationId: bridalGeneratedImage.recommendationId,
      type: bridalGeneratedImage.type,
      generationStatus: bridalGeneratedImage.generationStatus,
      errorMessage: bridalGeneratedImage.errorMessage,
    })
    .from(bridalGeneratedImage)
    .where(eq(bridalGeneratedImage.reportId, reportId));
  const primaryImageCount = recommendationsExpectedCount(images.filter(image => image.type === "full_body"));

  await db
    .update(bridalReport)
    .set({ status: primaryImageCount >= REQUIRED_PRIMARY_IMAGE_COUNT ? "ready" : "failed" })
    .where(eq(bridalReport.id, reportId));
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

    const primaryImageCount = recommendationsExpectedCount(existingImages.filter(image => image.type === "full_body"));
    const allImageCount = recommendationsExpectedCount(existingImages);
    if (primaryImageCount >= REQUIRED_PRIMARY_IMAGE_COUNT && allImageCount >= TOTAL_IMAGE_COUNT) {
      await db
        .update(bridalReport)
        .set({ status: "ready" })
        .where(eq(bridalReport.id, report.id));

      return NextResponse.json({
        reportId: report.id,
        status: "ready",
        imageCount: allImageCount,
        progress: countImageProgress(existingImages),
        detailProgress: countAllImageProgress(existingImages),
        reused: true,
      });
    }

    if (primaryImageCount >= REQUIRED_PRIMARY_IMAGE_COUNT && report.status !== "generating") {
      await db
        .update(bridalReport)
        .set({ status: "generating" })
        .where(eq(bridalReport.id, report.id));

      after(() => {
        void generateFullBridalReport(report.id).catch(async error => {
          console.error("Failed to backfill bridal report detail images in background:", error);
          await settleReportAfterGenerationError(report.id).catch(() => undefined);
        });
      });

      return NextResponse.json({
        reportId: report.id,
        status: "ready",
        imageCount: primaryImageCount,
        progress: countImageProgress(existingImages),
        detailProgress: countAllImageProgress(existingImages),
      });
    }

    if (report.status === "generating") {
      return NextResponse.json(
        {
          reportId: report.id,
          status: primaryImageCount >= REQUIRED_PRIMARY_IMAGE_COUNT ? "ready" : "generating",
          progress: countImageProgress(existingImages),
          detailProgress: countAllImageProgress(existingImages),
        },
        { status: primaryImageCount >= REQUIRED_PRIMARY_IMAGE_COUNT ? 200 : 202 },
      );
    }

    await db
      .update(bridalReport)
      .set({ status: "generating" })
      .where(eq(bridalReport.id, report.id));

    after(() => {
      void generateFullBridalReport(report.id).catch(async error => {
        console.error("Failed to generate full bridal report in background:", error);
        await settleReportAfterGenerationError(report.id).catch(() => undefined);
      });
    });

    return NextResponse.json(
      {
        reportId: report.id,
        status: "generating",
        progress: countImageProgress(existingImages),
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Failed to start full bridal report generation:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to start full bridal report generation") },
      { status: 500 },
    );
  }
}

async function generateFullBridalReport(reportId: string) {
  const [report] = await db
    .select()
    .from(bridalReport)
    .where(eq(bridalReport.id, reportId))
    .limit(1);

  if (!report || !report.isPaid) {
    throw new Error("Paid bridal report is required");
  }

  const existingImages = await db
    .select()
    .from(bridalGeneratedImage)
    .where(eq(bridalGeneratedImage.reportId, report.id));

  const existingPrimaryImageCount = recommendationsExpectedCount(existingImages.filter(image => image.type === "full_body"));
  const existingImageCount = recommendationsExpectedCount(existingImages);
  if (existingPrimaryImageCount >= REQUIRED_PRIMARY_IMAGE_COUNT && existingImageCount >= TOTAL_IMAGE_COUNT) {
    await db
      .update(bridalReport)
      .set({ status: "ready" })
      .where(eq(bridalReport.id, report.id));
    return;
  }

  const recommendations = await db
    .select()
    .from(bridalRecommendation)
    .where(eq(bridalRecommendation.reportId, report.id))
    .orderBy(bridalRecommendation.rank);

  if (recommendations.length === 0) {
    throw new Error("Recommendations are required");
  }

  const [photo] = await db
    .select({ r2Key: bridalUploadedPhoto.r2Key, processedR2Key: bridalUploadedPhoto.processedR2Key })
    .from(bridalUploadedPhoto)
    .where(
      and(
        eq(bridalUploadedPhoto.sessionId, report.sessionId),
        lte(bridalUploadedPhoto.createdAt, report.createdAt),
      ),
    )
    .orderBy(desc(bridalUploadedPhoto.createdAt))
    .limit(1);

  const [quiz] = await db
    .select({ answers: bridalQuizAnswer.answers })
    .from(bridalQuizAnswer)
    .where(eq(bridalQuizAnswer.sessionId, report.sessionId))
    .limit(1);
  const answers = quiz ? bridalQuizAnswersSchema.parse(quiz.answers) : undefined;
  const referenceImageUrl = photo ? getR2PublicUrl(photo.processedR2Key ?? photo.r2Key) : null;
  const providerInputImage = referenceImageUrl ? await getProviderInputImage(referenceImageUrl) : null;

  const allowImageFallback = canUseLocalImageFallback();
  const successfulImageByKey = new Map(
    existingImages
      .filter(image => image.generationStatus === "success" && !image.errorMessage && image.r2Key)
      .map(image => [`${image.recommendationId}:${image.type}`, image.r2Key as string]),
  );
  const fullBodyImageByRecommendationId = new Map(
    existingImages
      .filter(image => image.generationStatus === "success" && !image.errorMessage && image.r2Key && image.type === "full_body")
      .map(image => [image.recommendationId, image.r2Key as string]),
  );
  const successfulImageKeys = new Set(
    existingImages
      .filter(image => image.generationStatus === "success" && !image.errorMessage)
      .map(image => `${image.recommendationId}:${image.type}`),
  );

  type GenerationTask = {
    recommendation: (typeof recommendations)[number];
    imageType: (typeof BRIDAL_REPORT_IMAGE_TYPES)[number];
  };

  async function saveFailedImage(task: GenerationTask, prompt: string, error: unknown) {
    await db
      .insert(bridalGeneratedImage)
      .values({
        id: randomUUID(),
        reportId: report.id,
        recommendationId: task.recommendation.id,
        sessionId: report.sessionId,
        userId: report.userId,
        type: task.imageType,
        generationStatus: "failed",
        seedreamPrompt: prompt,
        promptVersion: BRIDAL_PROMPT_VERSION,
        errorMessage: getErrorMessage(error, "Failed to generate bridal image"),
        expiresAt: getBridalReportExpiry(),
      })
      .onConflictDoUpdate({
        target: [bridalGeneratedImage.recommendationId, bridalGeneratedImage.type],
        set: {
          generationStatus: "failed",
          seedreamPrompt: prompt,
          errorMessage: getErrorMessage(error, "Failed to generate bridal image"),
          updatedAt: new Date(),
        },
      });
  }

  async function saveSuccessfulImage(task: GenerationTask, imageUrl: string, prompt: string, fallbackReason: string | null) {
    await db
      .insert(bridalGeneratedImage)
      .values({
        id: randomUUID(),
        reportId: report.id,
        recommendationId: task.recommendation.id,
        sessionId: report.sessionId,
        userId: report.userId,
        type: task.imageType,
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
  }

  async function generateImageTask(task: GenerationTask) {
    const { recommendation, imageType } = task;
    const imageKey = `${recommendation.id}:${imageType}`;
    if (successfulImageKeys.has(imageKey)) {
      return;
    }

    const prompt = buildBridalImagePrompt(recommendation, imageType, answers);
    let imageUrl = getPlaceholderBridalImageUrl(recommendation.rank);
    let fallbackReason: string | null = null;

    try {
      if (!process.env.VOLCANO_ENGINE_API_KEY) {
        throw new Error("VOLCANO_ENGINE_API_KEY is not configured");
      }

      let inputImage = providerInputImage;
      if (imageType !== "full_body") {
        const fullBodyImageUrl =
          fullBodyImageByRecommendationId.get(recommendation.id) ??
          successfulImageByKey.get(`${recommendation.id}:full_body`);

        if (!fullBodyImageUrl) {
          throw new Error(`Full-body bridal look is required before generating ${imageType}`);
        }

        inputImage = await getProviderInputImage(getR2PublicUrl(fullBodyImageUrl));
      }

      if (
        !inputImage ||
        (!inputImage.startsWith("http") && !inputImage.startsWith("data:"))
      ) {
        throw new Error("A valid reference image is required for bridal image generation");
      }

      const result = await volcanoEngine.generateImage(prompt, {
        model: "doubao-seedream-5-0-260128",
        size: imageType === "full_body" ? "2K" : "1K",
        inputImages: [inputImage],
        watermark: false,
        timeoutMs: IMAGE_GENERATION_TIMEOUT_MS,
      });

      const providerUrl = result.data?.[0]?.url;
      if (!providerUrl) {
        throw new Error("Image provider response did not include an image URL");
      }

      imageUrl = await uploadImageFromUrl(providerUrl, report.userId ?? report.sessionId, "image");
    } catch (providerError) {
      if (!allowImageFallback) {
        await saveFailedImage(task, prompt, providerError);
        return;
      }

      fallbackReason = getErrorMessage(providerError, "Image provider failed, used placeholder fallback");
      console.warn("Bridal image provider failed, using local fallback:", fallbackReason);
    }

    try {
      await saveSuccessfulImage(task, imageUrl, prompt, fallbackReason);
      successfulImageKeys.add(imageKey);
      successfulImageByKey.set(imageKey, imageUrl);
      if (imageType === "full_body") {
        fullBodyImageByRecommendationId.set(recommendation.id, imageUrl);
      }
    } catch (imageError) {
      await saveFailedImage(task, prompt, imageError);
    }
  }

  const primaryTasks: GenerationTask[] = recommendations.slice(0, 3).flatMap(recommendation =>
    PRIMARY_IMAGE_TYPES.map(imageType => ({ recommendation, imageType })),
  );
  const detailTasks: GenerationTask[] = recommendations.slice(0, 3).flatMap(recommendation =>
    DETAIL_IMAGE_TYPES.map(imageType => ({ recommendation, imageType })),
  );

  await runWithConcurrency(primaryTasks, PRIMARY_IMAGE_CONCURRENCY, generateImageTask);

  const primaryImages = await db
    .select()
    .from(bridalGeneratedImage)
    .where(eq(bridalGeneratedImage.reportId, report.id));
  const primaryImageCount = recommendationsExpectedCount(primaryImages.filter(image => image.type === "full_body"));

  await db
    .update(bridalReport)
    .set({ status: primaryImageCount >= REQUIRED_PRIMARY_IMAGE_COUNT ? "ready" : "failed" })
    .where(eq(bridalReport.id, report.id));

  if (primaryImageCount < REQUIRED_PRIMARY_IMAGE_COUNT) {
    return;
  }

  await runWithConcurrency(detailTasks, DETAIL_IMAGE_CONCURRENCY, generateImageTask);

  await db
    .update(bridalReport)
    .set({ status: "ready" })
    .where(eq(bridalReport.id, report.id));
}
