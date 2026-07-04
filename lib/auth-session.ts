import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "fmac_session";
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export type AdminSession = {
  sub: string; // admin user id
  email: string;
  role: "ADMIN";
};

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET (or NEXTAUTH_SECRET) is missing or too short. Set a strong secret in your environment."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Sign a short-lived admin session JWT. */
export async function signSession(session: AdminSession): Promise<string> {
  return new SignJWT({ email: session.email, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

/**
 * Verify a session token. Edge-safe (uses jose only) so it can run inside
 * middleware. Returns null on any failure.
 */
export async function verifySession(
  token: string | undefined | null
): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payloadToSession(payload);
  } catch {
    return null;
  }
}

function payloadToSession(payload: JWTPayload): AdminSession | null {
  if (
    typeof payload.sub === "string" &&
    typeof payload.email === "string" &&
    payload.role === "ADMIN"
  ) {
    return { sub: payload.sub, email: payload.email, role: "ADMIN" };
  }
  return null;
}

export const SESSION_MAX_AGE = TOKEN_TTL_SECONDS;
