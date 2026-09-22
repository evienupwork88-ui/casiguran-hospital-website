"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMe } from "@/lib/api/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(pathname === "/admin/login");
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setIsReady(true);
      setSessionError(null);
      return;
    }

    let active = true;
    const timeoutMs = 10000;

    async function checkSession() {
      setIsReady(false);
      setSessionError(null);

      try {
        const sessionRequest = getMe();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Session check timed out")), timeoutMs);
        });

        await Promise.race([sessionRequest, timeoutPromise]);

        if (active) {
          setIsReady(true);
          setSessionError(null);
        }
      } catch (error) {
        if (!active) return;

        const message = error instanceof Error ? error.message : "Request failed";
        const isUnauthenticated = ["Not authenticated", "UNAUTHENTICATED", "Forbidden", "FORBIDDEN"].includes(message);

        if (isUnauthenticated) {
          setIsReady(true);
          setSessionError(null);
          router.replace("/admin/login");
          return;
        }

        const timeoutMessage = "The admin session check timed out. Please check the backend connection and try again.";
        setSessionError(message === "Session check timed out" ? timeoutMessage : "Unable to verify your session. Please sign in again.");
        setIsReady(true);
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (pathname !== "/admin/login" && !isReady) {
    return (
      <div className="admin-theme flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        Checking session...
      </div>
    );
  }

  if (pathname !== "/admin/login" && sessionError) {
    return (
      <div className="admin-theme flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">Session issue</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-900">Unable to verify session</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{sessionError}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <div className="admin-theme min-h-screen">{children}</div>;
}
