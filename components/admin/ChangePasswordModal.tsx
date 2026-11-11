"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  X,
} from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccess(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccess(null);

    // Basic client-side validation
    if (!currentPassword) {
      setError("Please enter your current admin password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password cannot be the same as your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to change admin password. Please try again.");
        return;
      }

      setSuccess(data.message || "Admin password changed successfully!");
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after a brief confirmation moment
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch {
      setError("Unable to reach the server. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-3xl border border-amber-500/30 relative overflow-hidden shadow-2xl bg-white/95 dark:bg-[#0E0C12]/95">
        {/* Ambient gold glow */}
        <div className="absolute -top-24 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-amber-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md shadow-amber-600/10 shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="change-password-title"
                className="text-xl font-serif font-bold gold-text-gradient leading-tight"
              >
                Change Admin Password
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Enter your current admin password to verify your identity and set a new password.
              </p>
            </div>
          </div>

          {/* Feedback banners */}
          {error && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="leading-relaxed font-medium">{success}</div>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Current Password */}
            <div>
              <label
                htmlFor="current-admin-password"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5"
              >
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="current-admin-password"
                  type={showCurrent ? "text" : "password"}
                  required
                  autoFocus
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current admin password"
                  disabled={loading}
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/30 text-sm font-mono focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100 disabled:opacity-60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  disabled={loading}
                  aria-label={showCurrent ? "Hide current password" : "Show current password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2. New Password */}
            <div>
              <label
                htmlFor="new-admin-password"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5"
              >
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-admin-password"
                  type={showNew ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={loading}
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/30 text-sm font-mono focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100 disabled:opacity-60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  disabled={loading}
                  aria-label={showNew ? "Hide new password" : "Show new password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 3. Confirm New Password */}
            <div>
              <label
                htmlFor="confirm-admin-password"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5"
              >
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-admin-password"
                  type={showConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  disabled={loading}
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/30 text-sm font-mono focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100 disabled:opacity-60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  disabled={loading}
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password security note */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Changing your password will renew your active session here and revoke sessions on other devices immediately.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300/60 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-600/20 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
