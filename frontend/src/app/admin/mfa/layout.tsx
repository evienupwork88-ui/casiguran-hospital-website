import { AdminAuthShell } from "@/components/admin/admin-auth-shell";

export default function AdminMfaLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthShell>{children}</AdminAuthShell>;
}
