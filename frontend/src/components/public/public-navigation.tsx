"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

export type PublicNavItem = {
  href?: string;
  label: string;
  children?: PublicNavItem[];
};

export const publicNavItems: PublicNavItem[] = [
  { href: "/", label: "Home" },
  {
    label: "Transparency Seal",
    children: [
      {
        label: "About CDH",
        children: [
          { href: "/mandate", label: "Mandate" },
          { href: "/vision-mission", label: "Mission, Vision & Service Pledge" },
          { href: "/key-officials", label: "Key Officials" },
          { href: "/hospital-history", label: "Hospital History" },
          { href: "/organizational-chart", label: "CDH Organizational Structure" },
        ],
      },
      { href: "/documents?category=citizens_charter", label: "Citizens Charter" },
      { href: "/transparency-seal", label: "Hospital Development Plan" },
    ],
  },
  {
    label: "Patient Care",
    children: [
      {
        label: "Corner",
        children: [
          { href: "/patient-rights", label: "Patient Rights" },
          { href: "/documents?category=policy", label: "Patient's Responsibilities" },
          { href: "/hospital-policy", label: "Hospital Policy" },
        ],
      },
      { href: "/opd", label: "Out-Patient Department" },
      { href: "/emergency-department", label: "Emergency Department" },
      {
        label: "Clinical Departments",
        children: [
          { href: "/dental", label: "Dental Department" },
          { href: "/family-community-medicine", label: "Family and Community Medicine" },
          { href: "/general-medicine", label: "General Medicine" },
          { href: "/obstetrics-and-gynecology", label: "Obstetrics and Gynecology" },
          { href: "/pediatrics", label: "Pediatrics" },
        ],
      },
      {
        label: "Allied Health Professional Service",
        children: [
          { href: "/himd", label: "Health Information Management Department" },
          { href: "/medical-social-service", label: "Medical Social Service Department" },
          { href: "/nutrition-and-dietetics", label: "Nutrition and Dietetics Department" },
          { href: "/pharmacy", label: "Pharmacy Department" },
        ],
      },
      {
        label: "Ancillary Services",
        children: [
          { href: "/pathology-laboratories", label: "Pathology and Laboratories" },
          { href: "/radiology", label: "Radiology" },
        ],
      },
      { href: "/rate-fees", label: "Rate and Fees" },
      { href: "/billing-claims", label: "Billing and Claims" },
      { href: "/nursing-service", label: "Nursing Service" },
    ],
  },
  { href: "/trainings", label: "Trainings" },
  { href: "/news", label: "News and Updates" },
  {
    label: "Data Privacy",
    children: [
      { href: "/documents?category=policy", label: "Privacy Notice" },
      { href: "/documents?category=policy", label: "Data Subject Consent Form" },
    ],
  },
  { href: "/contact", label: "Contacts" },
];

function isActive(pathname: string, item: PublicNavItem) {
  return Boolean(item.href && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))));
}

function MenuLink({ item, className = "", onClick }: { item: PublicNavItem; className?: string; onClick?: () => void }) {
  return (
    <Link
      href={item.href ?? "#"}
      onClick={onClick}
      className={className}
    >
      {item.label}
    </Link>
  );
}

export function PublicDesktopNavigation({ headerOverImage = false }: { headerOverImage?: boolean }) {
  const pathname = usePathname();
  // Remembers which dropdown was just used so it closes right after a link is clicked,
  // even if the mouse is still hovering over it.
  const [closedMenu, setClosedMenu] = useState<string | null>(null);

  return (
    <nav
      aria-label="Primary navigation"
      className={[
        "hidden items-center gap-1 whitespace-nowrap text-[0.78rem] font-medium lg:flex xl:gap-2 xl:text-[0.85rem] 2xl:text-[0.95rem]",
        headerOverImage ? "text-[#f2f3f4]" : "text-slate-600",
      ].join(" ")}
    >
      {publicNavItems.map((item) => {
        const active = isActive(pathname, item);

        if (!item.children) {
          return (
            <MenuLink
              key={item.label}
              item={item}
              className={[
                "inline-flex items-center gap-2 px-2 py-2 transition-colors xl:px-3",
                active
                  ? headerOverImage
                    ? "text-[#f2f3f4]"
                    : "text-violet-700"
                  : headerOverImage
                    ? "hover:text-white"
                    : "hover:text-violet-700",
              ].join(" ")}
            />
          );
        }

        const isClosed = closedMenu === item.label;
        const closeMenu = () => setClosedMenu(item.label);

        return (
          <div key={item.label} className="group relative" onMouseLeave={() => setClosedMenu(null)}>
            <button
              type="button"
              aria-haspopup="true"
              className={[
                "inline-flex cursor-default items-center gap-1 px-2 py-2 transition-colors xl:px-3",
                headerOverImage ? "hover:text-white group-hover:text-white" : "hover:text-violet-700 group-hover:text-violet-700",
              ].join(" ")}
            >
              {item.label}
              <ChevronDown size={14} className="transition-transform group-hover:rotate-180 group-has-[:focus-visible]:rotate-180" />
            </button>

            {/* pt-2 (not margin) keeps the hover area connected so the menu doesn't close while moving the mouse down */}
            <div
              className={[
                "absolute left-0 top-full z-50 pt-2 transition-opacity duration-150",
                isClosed
                  ? "hidden"
                  : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-has-[:focus-visible]:visible group-has-[:focus-visible]:opacity-100",
              ].join(" ")}
            >
              <div className="min-w-64 rounded-xl border border-[var(--gold-400)]/60 bg-white p-2 text-slate-700 shadow-xl">
                {item.children.map((child) =>
                  child.children ? (
                    <div key={child.label} className="group/nested relative">
                      <button
                        type="button"
                        aria-haspopup="true"
                        className="flex w-full cursor-default items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-violet-50 group-hover/nested:bg-violet-50"
                      >
                        {child.label}
                        <ChevronDown size={14} className="-rotate-90" />
                      </button>
                      <div className="invisible absolute left-full top-0 z-50 pl-1 opacity-0 transition-opacity duration-150 group-hover/nested:visible group-hover/nested:opacity-100 group-has-[:focus-visible]/nested:visible group-has-[:focus-visible]/nested:opacity-100">
                        <div className="min-w-64 rounded-xl border border-[var(--gold-400)]/60 bg-white p-2 shadow-xl">
                          {child.children.map((nested) => (
                            <MenuLink
                              key={nested.label}
                              item={nested}
                              onClick={closeMenu}
                              className="block rounded-lg px-3 py-2 text-sm hover:bg-violet-50"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <MenuLink
                      key={child.label}
                      item={child}
                      onClick={closeMenu}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-violet-50"
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function PublicMobileNavigation({ headerOverImage = false, onNavigate }: { headerOverImage?: boolean; onNavigate: () => void }) {
  return (
    <nav
      aria-label="Mobile navigation"
      className={["flex max-h-[70dvh] flex-col gap-1 overscroll-contain overflow-y-auto text-sm font-medium", headerOverImage ? "text-white" : "text-slate-700"].join(" ")}
    >
      {publicNavItems.map((item) =>
        item.children ? (
          <details key={item.label} className="border-b border-slate-100">
            <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-3 font-semibold [&::-webkit-details-marker]:hidden">
              {item.label}
              <ChevronDown size={16} />
            </summary>
            <div className="space-y-1 pb-2 pl-3">
              {item.children.map((child) =>
                child.children ? (
                  <details key={child.label}>
                    <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-2 font-medium [&::-webkit-details-marker]:hidden">
                      {child.label}
                      <ChevronDown size={14} />
                    </summary>
                    <div className="space-y-1 border-l border-violet-200 pl-2">
                      {child.children.map((nested) => (
                        <MenuLink key={nested.label} item={nested} onClick={onNavigate} className="block px-2 py-2 text-sm" />
                      ))}
                    </div>
                  </details>
                ) : (
                  <MenuLink key={child.label} item={child} onClick={onNavigate} className="block px-2 py-2 text-sm" />
                ),
              )}
            </div>
          </details>
        ) : (
          <MenuLink key={item.label} item={item} onClick={onNavigate} className="flex items-center gap-2 border-b border-slate-100 px-2 py-3" />
        ),
      )}
    </nav>
  );
}