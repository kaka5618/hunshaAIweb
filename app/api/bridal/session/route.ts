import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bridalAnonymousSession } from "@/lib/db/schema";
import {
  getBridalAnonymousSessionExpiry,
} from "@/lib/bridal/report";
import {
  BRIDAL_SESSION_COOKIE,
  getBridalSessionIdFromCookies,
  setBridalSessionCookie,
} from "@/lib/bridal/session";
import { eq } from "drizzle-orm";
import { getErrorMessage } from "@/lib/error-utils";

export async function POST(request: NextRequest) {
  try {
    const existingSessionId = await getBridalSessionIdFromCookies();

    if (existingSessionId) {
      const existing = await db
        .select({
          id: bridalAnonymousSession.id,
          status: bridalAnonymousSession.status,
          expiresAt: bridalAnonymousSession.expiresAt,
        })
        .from(bridalAnonymousSession)
        .where(eq(bridalAnonymousSession.id, existingSessionId))
        .limit(1);

      const activeSession = existing[0];
      if (
        activeSession &&
        activeSession.status === "active" &&
        activeSession.expiresAt.getTime() > Date.now()
      ) {
        return NextResponse.json({ sessionId: activeSession.id });
      }
    }

    const sessionId = randomUUID();
    const expiresAt = getBridalAnonymousSessionExpiry();

    await db.insert(bridalAnonymousSession).values({
      id: sessionId,
      expiresAt,
      deviceInfo: {
        userAgent: request.headers.get("user-agent"),
        referrer: request.headers.get("referer"),
      },
    });

    await setBridalSessionCookie(sessionId, expiresAt);

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("Failed to create bridal session:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to create bridal session") },
      { status: 500 }
    );
  }
}

export async function GET() {
  const sessionId = await getBridalSessionIdFromCookies();

  if (!sessionId) {
    const response = NextResponse.json({ sessionId: null }, { status: 404 });
    response.cookies.delete(BRIDAL_SESSION_COOKIE);
    return response;
  }

  return NextResponse.json({ sessionId });
}

