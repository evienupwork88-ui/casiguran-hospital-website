import { AdminShell } from "@/components/admin/admin-shell";
import { KeyOfficialsSlideshowManager } from "@/components/admin/key-officials-slideshow-manager";

export default function AdminKeyOfficialsSlideshowPage() {
  return (
    <AdminShell title="Key Officials Slideshow">
      <p className="mb-6 text-slate-600">
        Upload and manage the rotating header photos for the public Key Officials page.
      </p>
      <KeyOfficialsSlideshowManager />
    </AdminShell>
  );
}
