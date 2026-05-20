import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getAllowedImageHosts() {
  const hosts = new Set<string>();

  for (const value of [
    process.env.STORAGE_PUBLIC_URL,
    process.env.STORAGE_ENDPOINT,
  ]) {
    if (!value) {
      continue;
    }

    try {
      hosts.add(new URL(value).hostname);
    } catch {
      // Ignore malformed optional environment values.
    }
  }

  return hosts;
}

function isAllowedImageUrl(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return false;
  }

  const allowedHosts = getAllowedImageHosts();

  if (allowedHosts.has(url.hostname)) {
    return true;
  }

  return (
    url.hostname.endsWith(".r2.dev") ||
    url.hostname.endsWith(".r2.cloudflarestorage.com") ||
    url.hostname.endsWith(".volces.com") ||
    url.hostname.endsWith(".volcengine.com")
  );
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  let imageUrl: URL;

  try {
    imageUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  if (!isAllowedImageUrl(imageUrl)) {
    return NextResponse.json({ error: "Image host is not allowed" }, { status: 400 });
  }

  const imageResponse = await fetch(imageUrl, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!imageResponse.ok) {
    return NextResponse.json(
      { error: `Image fetch failed with status ${imageResponse.status}` },
      { status: 502 },
    );
  }

  const contentType = imageResponse.headers.get("content-type") || "image/png";

  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "URL did not return an image" }, { status: 415 });
  }

  return new Response(await imageResponse.arrayBuffer(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Content-Type": contentType,
    },
  });
}
