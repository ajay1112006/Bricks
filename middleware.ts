import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  isProtectedApi,
  isProtectedPage,
  isAdminSessionValid,
} from "@/lib/adminAuth";

/**
 * Server-side gate for the admin modules.
 *
 * Unauthenticated requests to Attendance / Billing / Materials / Splitter /
 * Ledger are redirected to /admin (with a `next` hint), while their API
 * endpoints answer with 401 instead of a redirect.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (await isAdminSessionValid(token)) {
    return NextResponse.next();
  }

  if (isProtectedApi(pathname)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — admin access required." },
      { status: 401 }
    );
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin";
  loginUrl.search = "";
  if (isProtectedPage(pathname)) {
    loginUrl.searchParams.set("next", `${pathname}${search}`);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Admin modules (pages + their nested routes)
    "/attendance",
    "/attendance/:path*",
    "/billing",
    "/billing/:path*",
    "/materials",
    "/materials/:path*",
    "/splitter",
    "/splitter/:path*",
    "/transactions",
    "/transactions/:path*",
    // Backing APIs of those modules
    "/api/attendance",
    "/api/attendance/:path*",
    "/api/orders",
    "/api/orders/:path*",
    "/api/materials",
    "/api/materials/:path*",
    "/api/trucks",
    "/api/trucks/:path*",
    "/api/hours-rent",
    "/api/hours-rent/:path*",
    "/api/employees",
    "/api/employees/:path*",
  ],
};
