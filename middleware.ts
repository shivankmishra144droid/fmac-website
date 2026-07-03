import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const isAdmin = session?.role === "ADMIN";

  const isProtectedApi =
    pathname === "/api/upload" ||
    (pathname.startsWith("/api/movies") &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(method));

  if (isProtectedApi && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminPage && !isLoginPage && !isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/movies/:path*", "/api/movies", "/api/upload", "/admin/:path*"],
};
