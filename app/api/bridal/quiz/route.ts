import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bridalQuizAnswer } from "@/lib/db/schema";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { bridalQuizAnswersSchema } from "@/lib/bridal/validation";
import { getErrorMessage } from "@/lib/error-utils";

export async function POST(request: Request) {
  try {
    const sessionId = await getBridalSessionIdFromCookies();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Bridal session is required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const answers = bridalQuizAnswersSchema.parse(body);

    const existing = await db
      .select({ id: bridalQuizAnswer.id })
      .from(bridalQuizAnswer)
      .where(eq(bridalQuizAnswer.sessionId, sessionId))
      .limit(1);

    if (existing[0]) {
      await db
        .update(bridalQuizAnswer)
        .set({
          answers,
          updatedAt: new Date(),
        })
        .where(eq(bridalQuizAnswer.id, existing[0].id));

      return NextResponse.json({ quizAnswerId: existing[0].id, sessionId });
    }

    const quizAnswerId = randomUUID();
    await db.insert(bridalQuizAnswer).values({
      id: quizAnswerId,
      sessionId,
      answers,
    });

    return NextResponse.json({ quizAnswerId, sessionId });
  } catch (error) {
    console.error("Failed to save bridal quiz:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to save bridal quiz") },
      { status: 400 }
    );
  }
}

