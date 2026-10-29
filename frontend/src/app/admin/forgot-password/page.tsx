"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestPasswordReset, resetPassword } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setStep("code");
      setMessage("If an active account uses that email, a 6-digit verification code has been sent. Check your inbox and spam folder.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send a verification code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword(email, code, password);
      router.push("/admin/login?passwordReset=success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Admin CMS</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {step === "email" ? "Enter your account email and we will send a verification code." : `Enter the code sent to ${email} and choose a new password.`}
        </p>

        {step === "email" ? (
          <form className="mt-6 space-y-5" onSubmit={handleRequestCode}>
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <input type="email" maxLength={254} autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
            </label>
            {message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
            {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:bg-violet-400">
              {isSubmitting ? "Sending..." : "Send verification code"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleReset}>
            {message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
            <label className="block text-sm font-medium text-slate-700">
              6-digit verification code
              <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              New password
              <input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
              <span className="mt-1 block text-xs font-normal text-slate-500">At least 12 characters.</span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Confirm new password
              <input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
            </label>
            {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800 disabled:bg-violet-400">
              {isSubmitting ? "Resetting..." : "Reset password"}
            </button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); setMessage(""); }} className="w-full text-sm font-medium text-violet-700 hover:text-violet-800">
              Use a different email or request a new code
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/admin/login" className="font-medium text-violet-700 hover:text-violet-800">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
