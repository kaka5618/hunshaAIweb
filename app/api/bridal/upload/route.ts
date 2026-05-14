import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bridalUploadedPhoto } from "@/lib/db/schema";
import { getBridalSessionIdFromCookies } from "@/lib/bridal/session";
import { getBridalUploadExpiry } from "@/lib/bridal/report";
import {
  BRIDAL_UPLOAD_MAX_BYTES,
  createBridalUploadKey,
  isAllowedBridalImageType,
} from "@/lib/bridal/upload";
import { isR2Configured, uploadToR2 } from "@/lib/r2-storage";
import { getErrorMessage } from "@/lib/error-utils";

function createFallbackDataUrl(buffer: Buffer, contentType: string) {
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = await getBridalSessionIdFromCookies();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Bridal session is required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const consent = formData.get("consent");
    const ageConfirmed = formData.get("ageConfirmed");
    const aiDisclosureAccepted = formData.get("aiDisclosureAccepted");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (consent !== "true" || ageConfirmed !== "true" || aiDisclosureAccepted !== "true") {
      return NextResponse.json(
        { error: "Photo authorization, age confirmation, and AI disclosure are required" },
        { status: 400 }
      );
    }

    if (!isAllowedBridalImageType(file.type)) {
      return NextResponse.json(
        { error: "Please upload a JPG, PNG, or WebP image" },
        { status: 400 }
      );
    }

    if (file.size > BRIDAL_UPLOAD_MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be less than 8MB" },
        { status: 400 }
      );
    }

    const photoId = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    const r2Key = createBridalUploadKey({
      sessionId,
      photoId,
      contentType: file.type,
    });

    const url = isR2Configured()
      ? await uploadToR2(r2Key, buffer, file.type)
      : createFallbackDataUrl(buffer, file.type);

    await db.insert(bridalUploadedPhoto).values({
      id: photoId,
      sessionId,
      r2Key,
      uploadStatus: "uploaded",
      moderationStatus: "approved",
      qualityScore: 1,
      expiresAt: getBridalUploadExpiry(),
    });

    return NextResponse.json({
      photoId,
      sessionId,
      url,
      r2Key,
      fallback: !isR2Configured(),
    });
  } catch (error) {
    console.error("Failed to upload bridal photo:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Failed to upload bridal photo") },
      { status: 500 }
    );
  }
}

