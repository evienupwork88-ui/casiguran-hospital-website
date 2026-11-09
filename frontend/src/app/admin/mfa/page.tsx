"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  ApiRequestError,
  completeMfaSetup,
  getMe,
  startMfaSetup,
  verifyMfa,
  type AuthUser,
} from "@/lib/api/auth";

type MfaSetup = { secret: string; otpauthUrl: string };

export default function AdminMfaPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [setup, setSetup] = useState<MfaSetup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMfaState() {
      try {
        const currentUser = await getMe();
        if (!active) return;
        if (!currentUser.requiresMfaSetup && !currentUser.requiresMfaVerification) {
          router.replace("/admin/dashboard");
          return;
        }

        setUser(currentUser);
        if (currentUser.requiresMfaSetup) {
          setSetup(await startMfaSetup());
        }
      } catch (loadError) {
        if (!active) return;
        if (loadError instanceof ApiRequestError && loadError.status === 401) {
          router.replace("/admin/login");
        } else {
          setError(loadError instanceof Error ? loadError.message : "Unable to load MFA setup.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadMfaState();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (user?.requiresMfaSetup) {
        setRecoveryCodes(await completeMfaSetup(code));
      } else {
        await verifyMfa(code, useRecoveryCode);
        router.replace("/admin/dashboard");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "MFA verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">Loading MFA...</main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Admin account security</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {recoveryCodes ? "Save your recovery codes" : user?.requiresMfaSetup ? "Set up two-factor authentication" : "Verify your identity"}
        </h1>

        {recoveryCodes ? (
          <>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              These codes can each be used once if you lose access to your authenticator. Save them somewhere private; they will not be shown again.
            </p>
            <pre className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-4 text-sm font-semibold tracking-wider text-slate-900">
              {recoveryCodes.map((recoveryCode) => <span key={recoveryCode}>{recoveryCode}</span>)}
            </pre>
            <button
              type="button"
              onClick={() => router.replace("/admin/dashboard")}
              className="mt-6 w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800"
            >
              I saved my codes — continue
            </button>
          </>
        ) : user?.requiresMfaSetup ? (
          <>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Open Google Authenticator, Microsoft Authenticator, or another authenticator app, scan this QR code, then enter the current six-digit code.
            </p>
            {setup ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mx-auto w-fit rounded-xl bg-white p-3">
                  <QRCodeSVG
                    value={setup.otpauthUrl}
                    size={208}
                    level="M"
                    marginSize={2}
                    title="Authenticator app setup QR code"
                  />
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-violet-700">
                    Can’t scan? Use manual setup
                  </summary>
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-600">Account</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-900">{user.email}</p>
                    <p className="mt-4 text-xs font-medium text-slate-600">Setup key</p>
                    <p className="mt-1 break-all font-mono text-lg font-bold tracking-wider text-slate-900">{setup.secret}</p>
                  </div>
                </details>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Enter the current code from your authenticator app.
          </p>
        )}

        {error ? (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {!recoveryCodes ? (
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {user?.requiresMfaVerification && useRecoveryCode ? (
              <label className="block text-sm font-medium text-slate-700" htmlFor="mfa-code">Recovery code</label>
            ) : (
              <label className="block text-sm font-medium text-slate-700" htmlFor="mfa-code">Six-digit code</label>
            )}
            <input
              id="mfa-code"
              autoComplete="one-time-code"
              inputMode={useRecoveryCode ? "text" : "numeric"}
              maxLength={useRecoveryCode ? 32 : 6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 font-mono text-lg tracking-[0.2em] text-slate-900 outline-none focus:border-violet-500 focus:bg-white"
              required
            />
            {user?.requiresMfaVerification ? (
              <button
                type="button"
                onClick={() => { setUseRecoveryCode((current) => !current); setCode(""); }}
                className="text-sm font-medium text-violet-700 hover:text-violet-900"
              >
                {useRecoveryCode ? "Use authenticator code" : "Use a recovery code"}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting || !setup && user?.requiresMfaSetup === true}
              className="w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
            >
              {isSubmitting ? "Verifying..." : "Continue"}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
