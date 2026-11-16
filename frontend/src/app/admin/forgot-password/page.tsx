"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminAuthShell } from "@/components/admin/admin-auth-shell";
import { requestPasswordReset } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setMessage("If an active account uses that email, password reset instructions have been sent. Check your inbox and spam folder.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to process the request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminAuthShell>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">Account recovery</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Forgot password?</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter your staff account email. If an active account matches, we will send a secure reset link.
      </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address
            <input
              id="email"
              type="email"
              maxLength={254}
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-violet-200 bg-violet-50/40 px-3 py-3 text-slate-900 outline-none focus:border-violet-600 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />
          </label>
          {message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl border-b-2 border-amber-500 bg-violet-800 px-4 py-3.5 text-sm font-semibold text-white hover:bg-violet-900 disabled:bg-violet-400">
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/admin/login" className="font-medium text-violet-700 hover:text-violet-800">Back to sign in</Link>
        </div>
    </AdminAuthShell>
  );
}
