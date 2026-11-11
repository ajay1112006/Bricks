"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Home, KeyRound, Loader2, Lock, ShieldAlert } from "lucide-react";
import ChangePasswordModal from "./ChangePasswordModal";

export default function AdminLogin({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next }),
      });
      const data = await res.json().catch(() => ({}) as { success?: boolean; error?: string; next?: string });

      if (!res.ok || !data.success) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      router.replace(data.next || "/admin");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-8 sm:py-14">
      <div className="glass-panel w-full max-w-md p-7 sm:p-9 rounded-3xl border-amber-500/30 relative overflow-hidden">
        {/* Ambient gold glow */}
        <div className="absolute -top-24 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-600/10">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-serif font-bold gold-text-gradient">Admin Access</h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Attendance, Billing, Materials, Splitter &amp; Ledger are restricted.
                <br />
                Enter the admin password to continue.
              </p>
            </div>

            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold font-serif tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Restricted Zone</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5"
              >
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/30 text-sm font-mono focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || password.length === 0}
              className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-sm shadow-lg shadow-amber-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Unlock Admin Panel</span>
              )}
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="inline-flex items-center space-x-1.5 text-xs text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 font-medium transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change admin password</span>
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between pt-4 border-t border-amber-900/10 dark:border-amber-500/20 text-xs">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {
          router.replace(next || "/admin");
          router.refresh();
        }}
      />
    </div>
  );
}
