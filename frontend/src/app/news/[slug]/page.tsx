import Link from "next/link";
import { PublicShell } from "@/components/public/site-shell";

const article = {
  category: "Announcement",
  date: "[Date to be provided]",
  title: "[Official article title to be provided]",
  image: "/cdh-hero.jpg",
  body: [
    "[Official article content to be provided by the hospital]",
    "[Official article content to be provided by the hospital]",
    "[Official article content to be provided by the hospital]",
  ],
};

const related = [
  { title: "[Related news title]", href: "/news" },
  { title: "[Related announcement title]", href: "/announcements" },
  { title: "[Related event title]", href: "/events" },
];

export default function NewsDetailPage() {
  return (
    <PublicShell
      title={article.title}
      subtitle="[Official news content to be provided]"
    >
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-[30px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)] md:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">
            <span>{article.category}</span>
            <span className="text-slate-400">•</span>
            <span>{article.date}</span>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-violet-200 bg-violet-50/60">
            <div className="h-[260px] bg-cover bg-center md:h-[360px]" style={{ backgroundImage: `url('${article.image}')` }} />
          </div>

          <article className="mt-8 prose max-w-none prose-slate">
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">{article.title}</h2>
            {article.body.map((paragraph) => (
              <p key={paragraph} className="mt-5 text-base leading-8 text-slate-600">
                {paragraph}
              </p>
            ))}
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

        <div className="mt-12 rounded-[30px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)] md:p-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Related</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.title} href={item.href} className="rounded-[22px] border border-violet-200 bg-violet-50/50 p-5 text-slate-800 hover:border-violet-300">
                <p className="text-base font-semibold text-slate-900">{item.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
