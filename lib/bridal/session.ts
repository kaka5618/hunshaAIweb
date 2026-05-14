import { cookies } from "next/headers";

export const BRIDAL_SESSION_COOKIE = "bridal_session_id";

export async function getBridalSessionIdFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(BRIDAL_SESSION_COOKIE)?.value ?? null;
}

export async function setBridalSessionCookie(sessionId: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(BRIDAL_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

