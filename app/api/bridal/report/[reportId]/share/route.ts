import { randomBytes, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bridalReport, bridalShareToken } from "@/lib/db/schema";
import { canAccessBridalResource } from "@/lib/bridal/permissions";
import { getBridalShareExpiry } from "@/lib/bridal/report";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { getErrorMessage } from "@/lib/error-utils";

function createShareToken() {
  return randomBytes(24).toString("base64url");
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
      return NextResponse.json({ error: "Report must be paid before sharing" }, { status: 402 });
    }

    const [existing] = await db
      .select()
      .from(bridalShareToken)
      .where(and(eq(bridalShareToken.reportId, report.id), eq(bridalShareToken.enabled, true)))
      .orderBy(desc(bridalShareToken.createdAt))
      .limit(1);

    const token = existing?.token ?? createShareToken();

    if (!existing) {
      await db.insert(bridalShareToken).values({
        id: randomUUID(),
        reportId: report.id,
        token,
        enabled: true,
        expiresAt: getBridalShareExpiry(),
      });
    }

    await db
      .update(bridalReport)
      .set({ shareEnabled: true })
      .where(eq(bridalReport.id, report.id));

    return NextResponse.json({
      token,
      url: `/share/${token}`,
    });
  } catch (error) {
    console.error("Failed to create bridal share link:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to create share link") },
      { status: 500 },
    );
  }
}
