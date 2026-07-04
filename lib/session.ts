import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  verifySession,
  type AdminSession,
} from "./auth-session";

/** Read + verify the admin session from the request cookies. */
export async function getSession(): Promise<AdminSession | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

/**
 * Guard for API route handlers. Returns the session on success, or a ready-to
 * return 401 NextResponse when unauthenticated. Usage:
 *
 *   const auth = await requireAdmin();
 *   if (auth instanceof NextResponse) return auth;
 *   // auth is AdminSession here
 */
export async function requireAdmin(): Promise<AdminSession | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  return session;
}
