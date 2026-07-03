import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Rate-limit by IP to blunt brute-force attempts.
  const ip = clientIp(req);
  const limited = rateLimit(`login:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid credentials format" },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always run a comparison to reduce timing/user-enumeration differences,
  // then respond with a single generic message.
  const ok = admin
    ? await verifyPassword(password, admin.hashedPassword)
    : await verifyPassword(password, "$2a$12$invalidinvalidinvalidinvalidinva");

  if (!admin || !ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = await signSession({
    sub: admin.id,
    email: admin.email,
    role: "ADMIN",
  });

  const res = NextResponse.json({
    ok: true,
    token,
    user: { id: admin.id, email: admin.email, role: admin.role },
  });

  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return res;
}
