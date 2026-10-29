"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicPage, type PageItem } from "@/lib/api/pages";

function toParagraphs(body?: string | null) {
  return body
    ? body
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
        .filter(Boolean)
    : [];
}

function toSingleParagraph(body?: string | null) {
  return body
    ? body.split(/\n+/).map((p) => p.trim()).filter(Boolean).join(" ")
    : "";
}

export default function VisionMissionPage() {
  const [visionPage, setVisionPage] = useState<PageItem | null>(null);
  const [missionPage, setMissionPage] = useState<PageItem | null>(null);
  const [pledgePage, setPledgePage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [visionData, missionData, pledgeData] = await Promise.all([
          getPublicPage("vision").catch(() => null),
          getPublicPage("mission").catch(() => null),
          getPublicPage("service-pledge").catch(() => null),
        ]);
        setVisionPage(visionData);
        setMissionPage(missionData);
        setPledgePage(pledgeData);
      } catch {
        setVisionPage(null);
        setMissionPage(null);
        setPledgePage(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const sections = [
    {
      page: visionPage,
      paragraphs: toParagraphs(visionPage?.body),
      fallbackTitle: "Vision",
      loadingText: "Loading vision...",
      emptyText: "Official vision statement will appear here once published.",
    },
    {
      page: missionPage,
      paragraphs: toParagraphs(missionPage?.body),
      fallbackTitle: "Mission",
      loadingText: "Loading mission...",
      emptyText: "Official mission statement will appear here once published.",
    },
    {
      page: pledgePage,
      paragraphs: [toSingleParagraph(pledgePage?.body)].filter(Boolean),
      fallbackTitle: "Service Pledge",
      loadingText: "Loading service pledge...",
      emptyText: "The official service pledge will appear here once published.",
    },
  ];

  return (
    <PublicShell
      title="Mission, Vision & Service Pledge"
      subtitle="Official institutional statements and guiding principles."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="space-y-12">
          {sections.map((section) => (
            <div
              key={section.fallbackTitle}
              className="rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)] sm:p-8"
            >
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-violet-700 sm:text-4xl">
                {section.page?.title || section.fallbackTitle}
              </h2>
              {isLoading ? (
                <p className="mt-4 text-base leading-6 text-slate-500">
                  {section.loadingText}
                </p>
              ) : section.paragraphs.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-base leading-6 text-slate-600">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-base leading-6 text-slate-600">
                  {section.emptyText}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}