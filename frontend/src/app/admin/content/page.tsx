import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";

const contentSections = [
  {
    title: "News",
    description: "Publish hospital stories, updates, and public health information.",
    href: "/admin/news",
  },
  {
    title: "Announcements",
    description: "Keep the community informed with urgent and scheduled notices.",
    href: "/admin/announcements",
  },
  {
    title: "Events",
    description: "Share upcoming hospital activities and community engagement events.",
    href: "/admin/events",
  },
  {
    title: "Services",
    description: "Add and organize the hospital's active service offerings and departments.",
    href: "/admin/services",
  },
  {
    title: "Documents",
    description: "Manage reports, policies, downloadable files, and official resources.",
    href: "/admin/documents",
  },
  {
    title: "Organizational Chart",
    description: "Upload and manage the current official hospital organizational chart.",
    href: "/admin/organizational-chart",
  },
  {
    title: "Pages",
    description: "Update the institutional pages that define the hospital's public identity.",
    href: "/admin/pages",
  },
];

export default function AdminContentPage() {
  return (
    <AdminShell title="Content Management">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(91,33,182,0.05)]">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">Content overview</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">Manage public website content</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contentSections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/60"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                  Manage
                </span>
                <span className="text-lg text-violet-700 transition group-hover:translate-x-0.5">→</span>
              </div>

              <h3 className="text-xl font-semibold tracking-[-0.04em] text-slate-900">{section.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
