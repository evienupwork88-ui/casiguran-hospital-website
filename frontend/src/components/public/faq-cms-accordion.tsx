"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { getPublicFaqs, FAQ_CATEGORIES, type FaqCategory, type FaqItem } from "@/lib/api/faqs";

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" });
}

export function FaqCmsAccordion() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategory | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicFaqs().then(setItems).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Unable to load FAQs.");
    });
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return items.filter((item) =>
      (category === "All" || item.category === category)
      && (!normalizedQuery || `${item.question} ${item.answer}`.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [category, items, query]);

  return (
    <section aria-labelledby="faq-heading" className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-[0_16px_35px_rgba(76,29,149,0.05)]">
      <div className="border-b border-violet-100 bg-violet-50/80 px-5 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-700">Helpful answers</p>
        <h2 id="faq-heading" className="mt-1 text-xl font-semibold text-slate-900">Frequently asked questions</h2>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <label className="relative block">
          <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <span className="sr-only">Search frequently asked questions</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions or answers" className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-violet-500" />
        </label>
        <div className="flex flex-wrap gap-2" aria-label="Filter FAQs by category">
          {(["All", ...FAQ_CATEGORIES] as const).map((value) => (
            <button key={value} type="button" onClick={() => setCategory(value)} aria-pressed={category === value} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${category === value ? "border-violet-700 bg-violet-700 text-white" : "border-violet-200 bg-white text-violet-800 hover:bg-violet-50"}`}>
              {value}
            </button>
          ))}
        </div>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        {!error && items.length === 0 ? <p className="text-sm text-slate-500">FAQs will appear here when published.</p> : null}
        {filteredItems.length > 0 ? (
          <div className="divide-y divide-violet-100 rounded-xl border border-violet-100">
            {filteredItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <article key={item.id} className="px-4 first:rounded-t-xl last:rounded-b-xl">
                  <button type="button" onClick={() => setOpenId(isOpen ? null : item.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                    <span className="font-semibold text-slate-900">{item.question}</span>
                    <ChevronDown size={18} className={`shrink-0 text-violet-700 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen ? (
                    <div className="pb-4 text-sm leading-6 text-slate-700">
                      <p className="whitespace-pre-wrap">{item.answer}</p>
                      <p className="mt-3 text-xs text-slate-500">{item.category} · Last updated {formatUpdatedAt(item.updatedAt)}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : !error && items.length > 0 ? <p className="text-sm text-slate-500">No FAQs match your search.</p> : null}
        <p className="text-sm font-medium text-violet-800">Hindi pa rin nasagot? Use form above.</p>
      </div>
    </section>
  );
}
