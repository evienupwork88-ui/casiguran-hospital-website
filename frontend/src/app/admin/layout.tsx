import type { Metadata } from "next";
import { AdminSessionGuard } from "./admin-session-guard";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const adminPath = (process.env.ADMIN_PATH || "/admin").replace(/\/+$/, "");
  return <AdminSessionGuard adminPath={adminPath}>{children}</AdminSessionGuard>;
}
