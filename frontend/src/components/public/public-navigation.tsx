"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, X } from "lucide-react";

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

export function PublicMobileNavigation({ onNavigate }: { headerOverImage?: boolean; onNavigate: () => void }) {
  const [menuStack, setMenuStack] = useState([{ label: "Main menu", items: publicNavItems }]);
  const currentMenu = menuStack[menuStack.length - 1];

  return (
    <nav aria-label="Mobile navigation" className="flex max-h-[75dvh] flex-col text-sm font-medium text-slate-700">
      <div className="mb-3 flex items-center justify-between gap-3">
        {menuStack.length > 1 ? (
          <button
            type="button"
            onClick={() => setMenuStack((stack) => stack.slice(0, -1))}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 font-semibold transition hover:bg-violet-50"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back
          </button>
        ) : (
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Choose a section</p>
        )}
        {menuStack.length > 1 ? (
          <p className="min-w-0 flex-1 truncate text-right text-xs text-slate-500">{currentMenu.label}</p>
        ) : null}
        <button
          type="button"
          onClick={onNavigate}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 font-semibold transition hover:bg-violet-50"
        >
          <X size={17} aria-hidden="true" />
          Close menu
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto overscroll-contain pb-2">
        {currentMenu.items.map((item) => {
          if (item.children) {
            const childItems = item.children;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setMenuStack((stack) => [...stack, { label: item.label, items: childItems }])}
                className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-base font-semibold transition hover:border-violet-200 hover:bg-violet-50"
              >
                <span>{item.label}</span>
                <ChevronRight size={19} aria-hidden="true" className="shrink-0" />
              </button>
            );
          }
          return (
            <MenuLink
              key={item.label}
              item={item}
              onClick={onNavigate}
              className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-800 transition hover:border-violet-200 hover:bg-violet-50"
            />
          );
        })}
      </div>
    </nav>
  );
}