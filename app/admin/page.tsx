import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminSessionValid, sanitizeNextPath } from "@/lib/adminAuth";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "Admin Panel | ELYON TRADERS",
  description:
    "Password-protected admin hub for Attendance, Billing, Materials, Splitter and Ledger.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const authenticated = await isAdminSessionValid(token);

  if (!authenticated) {
    return <AdminLogin next={sanitizeNextPath(params?.next)} />;
  }

  return <AdminDashboard />;
}
