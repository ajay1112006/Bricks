import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  sanitizeNextPath,
  verifyAdminPassword,
} from "@/lib/adminAuth";

/**
 * POST /api/admin/login — verifies the admin password and issues the
 * HttpOnly session cookie that middleware checks on every protected route.
 */
export async function POST(req: NextRequest) {
  let body: { password?: unknown; next?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // Malformed body is handled below as a missing password.
  }

  if (!verifyAdminPassword(body.password)) {
    // Small delay so a wrong password does not answer instantly (brute-force speed bump).
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json(
      { success: false, error: "Incorrect admin password. Access denied." },
      { status: 401 }
    );
  }

  const token = await createAdminSessionToken();
  const response = NextResponse.json({
    success: true,
    next: sanitizeNextPath(body.next),
  });

  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_COOKIE !== "true",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return response;
}
