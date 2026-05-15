import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bridalRecommendation,
  bridalReport,
  bridalShareToken,
  bridalVote,
} from "@/lib/db/schema";
import { bridalVoteTypeSchema } from "@/lib/bridal/validation";
import { getErrorMessage } from "@/lib/error-utils";

type Body = {
  recommendationId?: string;
  voteType?: string;
  voterName?: string;
};

function getVoterHash(request: NextRequest, token: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") ?? "";
  const ip = forwardedFor || realIp || "unknown";

  return createHash("sha256")
    .update(`${token}:${ip}:${userAgent}`)
    .digest("hex");
}

export async function POST(
  request: NextRequest,
  props: {
    params: Promise<{ token: string }>;
  },
) {
  try {
    const { token } = await props.params;
    const body = (await request.json()) as Body;
    const voteType = bridalVoteTypeSchema.parse(body.voteType);

    if (!body.recommendationId) {
      return NextResponse.json({ error: "Recommendation ID is required" }, { status: 400 });
    }

    const [share] = await db
      .select({
        reportId: bridalShareToken.reportId,
      })
      .from(bridalShareToken)
      .innerJoin(bridalReport, eq(bridalReport.id, bridalShareToken.reportId))
      .where(
        and(
          eq(bridalShareToken.token, token),
          eq(bridalShareToken.enabled, true),
          gt(bridalShareToken.expiresAt, new Date()),
          eq(bridalReport.shareEnabled, true),
        ),
      )
      .limit(1);

    if (!share) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    const [recommendation] = await db
      .select({ id: bridalRecommendation.id })
      .from(bridalRecommendation)
      .where(
        and(
          eq(bridalRecommendation.id, body.recommendationId),
          eq(bridalRecommendation.reportId, share.reportId),
        ),
      )
      .limit(1);

    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    const voterIpHash = getVoterHash(request, token);

    await db
      .insert(bridalVote)
      .values({
        id: randomUUID(),
        reportId: share.reportId,
        recommendationId: recommendation.id,
        voteType,
        voterName: body.voterName?.trim() || null,
        voterIpHash,
      })
      .onConflictDoUpdate({
        target: [bridalVote.reportId, bridalVote.voterIpHash, bridalVote.voteType],
        set: {
          recommendationId: recommendation.id,
          voterName: body.voterName?.trim() || null,
        },
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save bridal share vote:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to save vote") },
      { status: 500 },
    );
  }
}
