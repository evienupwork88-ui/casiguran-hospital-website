import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const adminPath = (process.env.ADMIN_PATH || "/admin").replace(/\/+$/, "");

export async function proxy(request: NextRequest) {
  return proxyRequest(request);
}

async function proxyRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const customAdminPrefix = `${adminPath}/`;

  if (adminPath !== "/admin" && (pathname === adminPath || pathname.startsWith(customAdminPrefix))) {
    const internalAdminPath = `/admin${pathname.slice(adminPath.length)}`;
    if (!isPublicAdminRoute(internalAdminPath)) {
      const accessResponse = await verifyAdminSession(request);
      if (accessResponse) return accessResponse;
    }
    const destination = request.nextUrl.clone();
    destination.pathname = internalAdminPath;
    return NextResponse.rewrite(destination);
  }

  if (adminPath !== "/admin" && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const destination = request.nextUrl.clone();
    destination.pathname = `${adminPath}${pathname.slice("/admin".length)}`;
    return NextResponse.redirect(destination);
  }

  if ((pathname === "/admin" || pathname.startsWith("/admin/")) && !isPublicAdminRoute(pathname)) {
    const accessResponse = await verifyAdminSession(request);
    if (accessResponse) return accessResponse;
  }

  return NextResponse.next();
}

function isPublicAdminRoute(pathname: string) {
  return pathname === "/admin/login" || pathname === "/admin/forgot-password";
}

async function verifyAdminSession(request: NextRequest): Promise<NextResponse | null> {
  const sessionCookieName = process.env.SESSION_COOKIE_NAME || "cdh_session";
  const sessionToken = request.cookies.get(sessionCookieName)?.value;
  if (!sessionToken) return adminLoginRedirect(request);

  const backendUrl = (
    process.env.BACKEND_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000"
  ).replace(/\/+$/, "");
  try {
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { Cookie: `${sessionCookieName}=${sessionToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return null;
    if (response.status === 401 || response.status === 403) return adminLoginRedirect(request);
    return new NextResponse("Unable to verify the admin session. Please try again.", { status: 503 });
  } catch {
    return new NextResponse("Unable to verify the admin session. Please try again.", { status: 503 });
  }
}

function adminLoginRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL(`${adminPath}/login`, request.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
