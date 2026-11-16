import Image from "next/image";
import Link from "next/link";
import { AdminAuthPhotoSlideshow } from "@/components/admin/admin-auth-photo-slideshow";

export function AdminAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#faf8f3]">
      <section className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-700"
        >
          <span className="flex shrink-0 items-center -space-x-1 sm:-space-x-3">
            <Image src="/pga-logo.png" alt="Provincial Government of Aurora logo" width={96} height={96} className="h-16 w-16 scale-[1.15] object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24" priority />
            <Image src="/cdh-logo-circle.png" alt="Casiguran District Hospital logo" width={96} height={96} className="h-16 w-16 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24" priority />
          </span>
          <span className="border-l-2 border-amber-500 pl-3 sm:pl-4">
            <span className="block text-base font-bold leading-tight text-violet-950 sm:text-xl lg:text-2xl">Casiguran District</span>
            <span className="block text-base font-bold leading-tight text-violet-950 sm:text-xl lg:text-2xl">Hospital PGA</span>
            <span className="mt-1 block text-xs font-medium text-violet-800 sm:text-sm lg:text-base">Official portal</span>
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="grid w-full max-w-[1440px] overflow-hidden rounded-3xl border border-white bg-white shadow-2xl shadow-violet-950/15 md:min-h-[600px] md:grid-cols-2 xl:min-h-0 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="relative min-h-48 overflow-hidden md:min-h-[600px] xl:min-h-0">
              <AdminAuthPhotoSlideshow />
              <div className="absolute inset-x-0 bottom-0 max-w-2xl p-6 text-white sm:p-8 lg:p-10">
                <span className="inline-flex items-center border-l-2 border-violet-300 bg-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-100 backdrop-blur-sm">
                  Admin Portal
                </span>
                <h2 className="image-overlay-heading mt-6 whitespace-nowrap text-[clamp(1rem,2.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em]">
                  Casiguran District Hospital
                </h2>
              </div>
            </div>
            <div className="flex items-center justify-center p-6 sm:p-10 xl:aspect-square">
              <div className="w-full max-w-md">{children}</div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          Casiguran District Hospital <span className="mx-1 text-amber-700">•</span> Admin portal
        </p>
      </section>
    </main>
  );
}
