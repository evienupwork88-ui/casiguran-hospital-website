import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";

const contentSections = [
  {
    title: "Transparency Seal",
    description: "Manage About CDH institutional pages, the Hospital Development Plan PDF, and other official transparency documents.",
    links: [
      { label: "Institutional pages", href: "/admin/pages" },
      { label: "Official documents", href: "/admin/documents" },
    ],
  },
  {
    title: "Patient Care",
    description: "Manage the service and department content used by Patient Care, including outpatient, clinical, allied health, ancillary, and nursing sections.",
    links: [{ label: "Services and departments", href: "/admin/services" }],
  },
  {
    title: "Programs",
    description: "Use the Services manager for Public Health Unit, Patient Safety, Gender and Development, and Teen Wellness Center entries.",
    links: [{ label: "Manage programs", href: "/admin/services" }],
  },
  {
    title: "Trainings and Research",
    description: "Publish training and research files through the existing Documents manager.",
    links: [{ label: "Manage documents", href: "/admin/documents" }],
  },
  {
    title: "Procurement",
    description: "Upload and publish BAC resolutions, bid bulletins, bidding documents, notices, agreements, and procurement records as official documents.",
    links: [{ label: "Manage procurement documents", href: "/admin/documents" }],
  },
  {
    title: "News and Updates",
    description: "Publish CDH News and CDH Updates through the existing news and announcements managers.",
    links: [
      { label: "CDH News", href: "/admin/news" },
      { label: "CDH Updates", href: "/admin/announcements" },
    ],
  },
  {
    title: "Data Privacy",
    description: "Publish the Privacy Notice and Data Subject Consent Form using the existing official documents manager.",
    links: [{ label: "Manage privacy documents", href: "/admin/documents" }],
  },
  {
    title: "Contacts",
    description: "Maintain the CMS-driven address, phone, email, map, Facebook link, office hours, and emergency service settings.",
    links: [{ label: "Manage contact settings", href: "/admin/settings" }],
  },
];

export default function AdminContentPage() {
  return (
    <AdminShell title="Content Management">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(91,33,182,0.05)]">
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">Content overview</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">Manage public navigation content</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contentSections.map((section) => (
            <div
              key={section.title}
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
              <div className="mt-5 flex flex-wrap gap-2">
                {section.links.map((link) => (
                  <Link key={link.href + link.label} href={link.href} className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
