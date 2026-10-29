"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicRateFees, RATE_FEE_CATEGORIES, type RateFeeCategory, type RateFeeItem } from "@/lib/api/rate-fees";

const categories = Object.keys(RATE_FEE_CATEGORIES) as RateFeeCategory[];

function FeeTable({ category, items }: { category: RateFeeCategory; items: RateFeeItem[] }) {
  const columns = RATE_FEE_CATEGORIES[category].columns;
  const groups = new Map<string, RateFeeItem[]>();
  for (const item of items) {
    const section = item.section ?? "";
    groups.set(section, [...(groups.get(section) ?? []), item]);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead className="bg-violet-900 text-white">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Service / Item</th>
            {columns.map((column) => <th scope="col" key={column} className="px-4 py-3 text-right font-semibold">{column}</th>)}
          </tr>
        </thead>
        {Array.from(groups.entries()).map(([section, groupItems]) => (
          <tbody key={section} className="divide-y divide-slate-200">
            {section ? (
              <tr className="bg-violet-100">
                <th scope="rowgroup" colSpan={columns.length + 1} className="px-4 py-2 font-semibold uppercase tracking-wide text-violet-900">{section}</th>
              </tr>
            ) : null}
            {groupItems.map((item) => (
              <tr key={item.id} className="odd:bg-white even:bg-slate-50">
                <th scope="row" className="px-4 py-3 font-medium text-slate-800">{item.itemName}</th>
                {[item.price1, item.price2, item.price3].slice(0, columns.length).map((price, index) => (
                  <td key={index} className="px-4 py-3 text-right tabular-nums text-slate-700">{price || "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export default function RateFeesPage() {
  const [activeCategory, setActiveCategory] = useState<RateFeeCategory>("pharmacy");
  const [items, setItems] = useState<RateFeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getPublicRateFees();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const activeItems = items.filter((item) => item.category === activeCategory);

  return (
    <PublicShell title="Rate and Fees" subtitle="View published rates for hospital services, medicines, and records.">
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div role="tablist" aria-label="Rate and fee categories" className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
          {categories.map((category) => (
            <button
              type="button"
              role="tab"
              key={category}
              id={`rate-tab-${category}`}
              aria-selected={activeCategory === category}
              aria-controls={`rate-panel-${category}`}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                activeCategory === category ? "bg-violet-700 text-white" : "bg-violet-50 text-violet-800 hover:bg-violet-100"
              }`}
            >
              {RATE_FEE_CATEGORIES[category].label}
            </button>
          ))}
        </div>

        <div id={`rate-panel-${activeCategory}`} role="tabpanel" aria-labelledby={`rate-tab-${activeCategory}`}>
          {isLoading ? (
            <div role="status" aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading rates and fees...</div>
          ) : hasError ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-800">Unable to load rates and fees. Please try again later.</div>
          ) : activeItems.length ? (
            <FeeTable category={activeCategory} items={activeItems} />
          ) : (
            <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-10 text-center text-slate-600">
              <p className="font-semibold text-slate-900">No published items in {RATE_FEE_CATEGORIES[activeCategory].label} yet.</p>
              <p className="mt-2 text-sm">Published items will appear here once added by the hospital.</p>
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-slate-500">Please confirm current rates with the appropriate hospital office before making a payment.</p>
        </div>
      </section>
    </PublicShell>
  );
}
