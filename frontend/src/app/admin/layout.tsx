"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMe } from "@/lib/api/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(pathname === "/admin/login");

  useEffect(() => {
    if (pathname === "/admin/login") {
      setIsReady(true);
      return;
    }

    let active = true;

    async function checkSession() {
      try {
        await getMe();
        if (active) setIsReady(true);
      } catch {
        if (active) {
          router.replace("/admin/login");
        }
      }
    }

    setIsReady(false);
    checkSession();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (pathname !== "/admin/login" && !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
