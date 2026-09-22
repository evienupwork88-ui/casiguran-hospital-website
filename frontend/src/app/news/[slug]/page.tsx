import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicNewsBySlug, type NewsItem } from "@/lib/api/news";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && (error as Error & { status?: number }).status === 404;
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: NewsItem;

  try {
    article = await getPublicNewsBySlug(slug);
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }

    return (
      <PublicShell title="News" subtitle="Official hospital news, updates, and public information.">
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <div className="rounded-[30px] border border-dashed border-violet-200 bg-white p-8 text-center text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
            <p className="font-semibold text-slate-900">This news article is temporarily unavailable</p>
            <p className="mt-2 text-sm">Please check back again later.</p>
          </div>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell
      title={article.title}
      subtitle={article.excerpt || "Official hospital news, updates, and public information."}
    >
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-[30px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)] md:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">
            <span>News</span>
            <span className="text-slate-400">•</span>
            <span>{formatDate(article.publishedAt || article.createdAt)}</span>
          </div>

          {article.coverImageUrl ? (
            <div className="overflow-hidden rounded-[24px] border border-violet-200 bg-violet-50/60">
              <div
                className="h-[260px] bg-cover bg-center md:h-[360px]"
                style={{ backgroundImage: `url('${article.coverImageUrl}')` }}
              />
            </div>
          ) : null}

          <article className="mt-8 prose max-w-none prose-slate">
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">{article.title}</h2>
            <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">{article.body}</p>
          </article>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/news" className="rounded-full bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800">
              Back to News
            </Link>
            <Link href="/" className="rounded-full border border-violet-200 bg-white px-5 py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-50">
              Go to Home
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
