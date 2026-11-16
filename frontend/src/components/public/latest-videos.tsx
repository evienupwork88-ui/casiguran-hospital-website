"use client";

import { useCallback, useEffect } from "react";
import Script from "next/script";
import { FacebookPostEmbed } from "@/components/public/facebook-post-embed";

declare global {
  interface Window {
    FB?: {
      XFBML: {
        parse: (element?: HTMLElement) => void;
      };
    };
  }
}

export type LatestVideoItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  url: string;
};

function formatVideoDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function LatestVideos({ videos }: { videos: LatestVideoItem[] }) {
  const latestVideo = [...videos].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0];
  const parseFacebookEmbed = useCallback(() => {
    window.FB?.XFBML.parse();
  }, []);

  useEffect(() => {
    parseFacebookEmbed();
  }, [latestVideo?.url, parseFacebookEmbed]);

  if (!latestVideo) return null;

  return (
    <section
      aria-labelledby="latest-videos-title"
      className="my-8 rounded-[26px] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-slate-50 px-4 py-6 text-slate-900 shadow-[0_16px_40px_rgba(76,29,149,0.08)] sm:px-6 sm:py-8"
    >
      <div className="mx-auto max-w-7xl">
        <h2 id="latest-videos-title" className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
          Latest Videos
        </h2>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-violet-100 bg-violet-50 shadow-sm">
            <FacebookPostEmbed
              postUrl={latestVideo.url}
              title={latestVideo.title}
              width={800}
            />
          </div>
          <div className="py-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
              {formatVideoDate(latestVideo.date)}
            </p>
            <h3 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{latestVideo.title}</h3>
            {latestVideo.description ? (
              <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
                {latestVideo.description}
              </p>
            ) : null}
            <a
              href={latestVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              Open on Facebook ↗
            </a>
          </div>
        </div>
        <div id="fb-root" />
        <Script
          id="facebook-javascript-sdk"
          src="https://connect.facebook.net/en_US/sdk.js#xfbml=0&version=v23.0"
          strategy="afterInteractive"
          onReady={parseFacebookEmbed}
        />
      </div>
    </section>
  );
}
