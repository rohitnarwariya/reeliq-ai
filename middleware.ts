import { type NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/Dashboard", "/profile", "/saved-songs", "/favorites"];
const authPaths = ["/loginpage", "/signuppage"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie (Supabase stores session in cookies)
  const hasSession = request.cookies.has("sb-access-token") || request.cookies.has("sb-refresh-token");

  // Redirect to login if accessing a protected route without a session
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !hasSession) {
    const loginUrl = new URL("/loginpage", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to Dashboard if already logged in and visiting auth pages
  if (authPaths.some((p) => pathname.startsWith(p)) && hasSession) {
    return NextResponse.redirect(new URL("/Dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handle their own auth)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|auth/callback).*)",
  ],
};