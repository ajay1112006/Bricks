import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/adminAuth";
import { persistNewAdminPassword } from "@/lib/adminPasswordStore";

/**
 * POST /api/admin/change-password
 *
 * Changes the admin password by verifying the current password, updating
 * persistent storage (.env.local + MongoDB if available), and re-issuing
 * the session token with the new secret so the user remains authenticated.
 */
export async function POST(req: NextRequest) {
  let body: {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword, confirmPassword } = body;

  // 1. Verify current password
  if (typeof currentPassword !== "string" || !verifyAdminPassword(currentPassword)) {
    // Brute-force delay
    await new Promise((resolve) => setTimeout(resolve, 350));
    return NextResponse.json(
      { success: false, error: "Incorrect current password. Access denied." },
      { status: 401 }
    );
  }

  // 2. Validate new password
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return NextResponse.json(
      { success: false, error: "New password must be at least 6 characters long." },
      { status: 400 }
    );
  }

  if (newPassword.length > 128) {
    return NextResponse.json(
      { success: false, error: "New password must not exceed 128 characters." },
      { status: 400 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { success: false, error: "New password must be different from your current password." },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, error: "New password and confirm password do not match." },
      { status: 400 }
    );
  }

  // 3. Persist new password across environment, memory & DB
  await persistNewAdminPassword(newPassword);

  // 4. Issue a new session token signed with the new password
  const token = await createAdminSessionToken();
  const response = NextResponse.json({
    success: true,
    message: "Admin password updated successfully. Your session has been renewed.",
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
