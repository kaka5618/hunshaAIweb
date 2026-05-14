import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bridalQuizAnswer,
  bridalRecommendation,
  bridalReport,
  bridalUploadedPhoto,
} from "@/lib/db/schema";
import {
  BRIDAL_REPORT_CURRENCY,
  BRIDAL_REPORT_PRICE_CENTS,
} from "@/lib/bridal/constants";
import { generateBridalRecommendations } from "@/lib/bridal/deepseek";
import { getBridalReportExpiry } from "@/lib/bridal/report";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { bridalQuizAnswersSchema } from "@/lib/bridal/validation";
import { getErrorMessage } from "@/lib/error-utils";

export async function POST() {
  let reportId: string | null = null;

  try {
    const sessionId = await getBridalSessionIdFromCookies();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Bridal session is required" },
        { status: 401 },
      );
    }

    const [existingReport] = await db
      .select({
        id: bridalReport.id,
        status: bridalReport.status,
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

    if (existingReport) {
      return NextResponse.json({
        reportId: existingReport.id,
        status: existingReport.status,
        reused: true,
      });
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
      .select({ id: bridalUploadedPhoto.id })
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

    const recommendations = await generateBridalRecommendations(answers);

    await db.insert(bridalRecommendation).values(
      recommendations.map(recommendation => ({
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
      })),
    );

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
