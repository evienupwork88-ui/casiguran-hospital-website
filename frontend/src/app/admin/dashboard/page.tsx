"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getMe, logout, type AuthUser } from "@/lib/api/auth";
import { getAdminAnnouncements, type AnnouncementItem } from "@/lib/api/announcements";
import { getAdminDocuments, type DocumentItem } from "@/lib/api/documents";
import { getAdminEvents, type EventItem } from "@/lib/api/events";
import { getAdminNews, type NewsItem } from "@/lib/api/news";
import { getAdminPages, type PageItem } from "@/lib/api/pages";
import { getAdminServices, type ServiceItem } from "@/lib/api/services";

type DashboardStat = {
  label: string;
  count: number;
  href: string;
  accent: string;
  meta: string;
};

type RecentItem = {
  id: string;
  title: string;
  section: string;
  href: string;
  updatedAt: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getMe();
        setUser(currentUser);
      } catch {
        router.replace("/admin/login");
      }
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [news, announcements, events, services, documents, pages] = await Promise.all([
          getAdminNews(),
          getAdminAnnouncements(),
          getAdminEvents(),
          getAdminServices(),
          getAdminDocuments(),
          getAdminPages(),
        ]);

        const nextStats: DashboardStat[] = [
          { label: "News", count: news.length, href: "/admin/news", accent: "violet", meta: "Latest updates" },
          { label: "Announcements", count: announcements.length, href: "/admin/announcements", accent: "amber", meta: "Public notices" },
          { label: "Events", count: events.length, href: "/admin/events", accent: "sky", meta: "Upcoming activities" },
          { label: "Services", count: services.length, href: "/admin/services", accent: "emerald", meta: "Care offerings" },
          { label: "Documents", count: documents.length, href: "/admin/documents", accent: "slate", meta: "Reports and files" },
          { label: "Pages", count: pages.length, href: "/admin/pages", accent: "purple", meta: "Institutional pages" },
        ];

        const combined: RecentItem[] = [
          ...news.map((item: NewsItem) => ({
            id: item.id,
            title: item.title,
            section: "News",
            href: "/admin/news",
            updatedAt: item.updatedAt ?? item.publishedAt ?? null,
          })),
          ...announcements.map((item: AnnouncementItem) => ({
            id: item.id,
            title: item.title,
            section: "Announcements",
            href: "/admin/announcements",
            updatedAt: item.updatedAt ?? item.publishAt ?? null,
          })),
          ...events.map((item: EventItem) => ({
            id: item.id,
            title: item.title,
            section: "Events",
            href: "/admin/events",
            updatedAt: item.updatedAt ?? item.startAt ?? null,
          })),
          ...services.map((item: ServiceItem) => ({
            id: item.id,
            title: item.name,
            section: "Services",
            href: "/admin/services",
            updatedAt: item.updatedAt ?? null,
          })),
          ...documents.map((item: DocumentItem) => ({
            id: item.id,
            title: item.title,
            section: "Documents",
            href: "/admin/documents",
            updatedAt: item.publishedAt ?? item.createdAt ?? null,
          })),
          ...pages.map((item: PageItem) => ({
            id: item.slug,
            title: item.title,
            section: "Pages",
            href: "/admin/pages",
            updatedAt: item.updatedAt ?? null,
          })),
        ].sort((a, b) => {
          const first = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const second = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return second - first;
        }).slice(0, 5);

        setStats(nextStats);
        setRecentItems(combined);
      } catch {
        setStats([]);
        setRecentItems([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        Loading dashboard...
      </div>
    );
  }

  const cardStyles: Record<string, string> = {
    violet: "border-violet-200 bg-violet-50/60",
    amber: "border-amber-200 bg-amber-50/60",
    sky: "border-sky-200 bg-sky-50/60",
    emerald: "border-emerald-200 bg-emerald-50/60",
    slate: "border-slate-200 bg-slate-50/80",
    purple: "border-purple-200 bg-purple-50/80",
  };

  return (
    <AdminShell title="Dashboard" user={user} onLogout={handleLogout} isLoggingOut={isLoggingOut}>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[28px] border border-violet-200 bg-white shadow-[0_18px_45px_rgba(91,33,182,0.06)]">
          <div className="relative min-h-[220px] overflow-hidden bg-slate-200">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/cdh-hero.jpg')" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(27,17,44,0.82),rgba(46,16,101,0.58),rgba(46,16,101,0.08))]" />

            <div className="relative flex min-h-[220px] items-center justify-between gap-4 p-6 md:p-8">
              <div className="max-w-lg">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-100">Casiguran District Hospital</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white md:text-4xl">Hospital administration dashboard</h2>
                <p className="mt-3 max-w-md text-sm text-violet-50 md:text-base">
                  Maintain the hospital website, public updates, services, reports, and institutional pages from one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">Overview</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Content summary</h3>
            </div>
            <span className="text-sm text-slate-500">{isLoading ? "Syncing data..." : "Updated"}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="mt-4 h-8 w-14 rounded bg-slate-200" />
                  <div className="mt-4 h-3 w-28 rounded bg-slate-200" />
                </div>
              ))
            ) : stats.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3 rounded-[24px] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                No content data is available yet. Use the admin sections to add content.
              </div>
            ) : (
              stats.map((stat) => (
                <div key={stat.label} className={`rounded-[24px] border p-5 shadow-sm ${cardStyles[stat.accent]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                      <p className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-slate-900">{stat.count}</p>
                    </div>
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                      {stat.meta}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200/80 pt-4">
                    <span className="text-sm text-slate-600">{stat.count === 0 ? "Empty" : "Ready"}</span>
                    <Link href={stat.href} className="text-sm font-semibold text-violet-700 hover:text-violet-800">
                      View all →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(91,33,182,0.05)]">
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">Quick actions</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Create and update</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/admin/news" className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-100">
                <p className="text-sm font-semibold text-violet-900">Create News</p>
              </Link>
              <Link href="/admin/announcements" className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-100">
                <p className="text-sm font-semibold text-violet-900">Create Announcement</p>
              </Link>
              <Link href="/admin/events" className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-100">
                <p className="text-sm font-semibold text-violet-900">Create Event</p>
              </Link>
              <Link href="/admin/documents" className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-100">
                <p className="text-sm font-semibold text-violet-900">Upload Document</p>
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(91,33,182,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">Recently updated</p>
            <div className="mt-5 space-y-3">
              {recentItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No recent content updates yet.
                </div>
              ) : (
                recentItems.map((item) => (
                  <div key={`${item.section}-${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-violet-700">{item.section}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{item.title}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "No date"}
                      </p>
                      <Link href={item.href} className="mt-1 inline-block text-xs font-semibold text-violet-700 hover:text-violet-800">
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
