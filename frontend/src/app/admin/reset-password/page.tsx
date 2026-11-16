"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AdminAuthShell } from "@/components/admin/admin-auth-shell";
import { resetPassword } from "@/lib/api/auth";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [isTokenReady, setIsTokenReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const match = window.location.hash.match(/^#token=([a-f0-9]{64})$/i);
    if (match) {
      setToken(match[1].toLowerCase());
      window.history.replaceState(null, "", window.location.pathname);
    }
    setIsTokenReady(true);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is invalid or expired. Request a new one.");
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setError("Password must be between 12 and 128 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password, confirmPassword);
      setToken(null);
      setPassword("");
      setConfirmPassword("");
      setIsComplete(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to reset your password. Request a new link and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasValidLength = password.length >= 12 && password.length <= 128;

  return (
    <AdminAuthShell>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Account recovery</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{isComplete ? "Password updated" : "Reset password"}</h1>

        {isComplete ? (
          <>
            <p role="status" className="mt-4 text-sm leading-6 text-slate-600">
              Your password was changed and existing sessions were signed out. Sign in with your new password.
            </p>
            <Link href="/admin/login" className="mt-6 block w-full rounded-xl bg-violet-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-violet-800">
              Go to sign in
            </Link>
          </>
        ) : !isTokenReady ? (
          <p className="mt-4 text-sm text-slate-600">Validating your reset link...</p>
        ) : !token ? (
          <>
            <p role="alert" className="mt-4 text-sm leading-6 text-slate-600">
              This reset link is invalid, expired, or already used. Request a new link to continue.
            </p>
            <Link href="/admin/forgot-password" className="mt-6 block w-full rounded-xl bg-violet-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-violet-800">
              Request a new link
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">Choose a new password for your staff account.</p>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                New password
                <span className="relative mt-2 block">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-violet-200 bg-violet-50/40 px-3 py-3 pr-11 text-slate-900 outline-none focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
                Confirm new password
                <span className="relative mt-2 block">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-violet-200 bg-violet-50/40 px-3 py-3 pr-11 text-slate-900 outline-none focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide confirmation" : "Show confirmation"}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>

              <ul aria-label="Password requirements" className="space-y-1 text-xs text-slate-600">
                <li className={hasValidLength ? "text-emerald-700" : ""}>
                  {hasValidLength ? "✓" : "•"} 12 to 128 characters
                </li>
                <li>• Spaces and all character types are allowed; no composition rules.</li>
                <li>• Common and known-compromised passwords are rejected securely on submit.</li>
              </ul>

              {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:bg-violet-400">
                {isSubmitting ? "Updating password..." : "Submit new password"}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/admin/login" className="font-medium text-violet-700 hover:text-violet-800">Back to sign in</Link>
        </div>
    </AdminAuthShell>
  );
}
