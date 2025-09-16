import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Security & Advisories | Pulse 360",
  description: "Security posture, advisories & incident awareness (placeholder)."
};

export default function SecurityPage() {
  return (
    <main className="w-full flex flex-col items-center bg-white dark:bg-black pt-10 pb-24">
      <div className="w-full max-w-5xl px-4 md:px-8">
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Security & Advisories</h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-gray-600 dark:text-gray-400">Central surface for service health, security advisories, vulnerability disclosures & incident timelines.</p>
        </header>
        <section aria-labelledby="msrc-links" className="mb-14">
          <h2 id="msrc-links" className="sr-only">Microsoft Security Response Center Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 auto-rows-[13rem] md:auto-rows-[15rem]">
            <Link
              href="/msrc"
              className="group flex flex-col items-center justify-center text-center rounded-3xl border border-gray-200/60 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/65 backdrop-blur-lg shadow-[0_4px_18px_-6px_rgba(0,0,0,0.20)] dark:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.70)] p-5 overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/60 dark:focus-visible:ring-primary-800/60 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 hover:border-primary-300/50 dark:hover:border-primary-600/50 hover:bg-white/90 dark:hover:bg-gray-900/75 h-full"
            >
               <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight">MSRC Portal</h3>
               <p className="mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-[22ch]">Official Microsoft Security Response Center portal for vulnerability & security update information.</p>
            </Link>
            <Link
              href="/msrc/blog"
              className="group flex flex-col items-center justify-center text-center rounded-3xl border border-gray-200/60 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/65 backdrop-blur-lg shadow-[0_4px_18px_-6px_rgba(0,0,0,0.20)] dark:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.70)] p-5 overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/60 dark:focus-visible:ring-primary-800/60 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 hover:border-primary-300/50 dark:hover:border-primary-600/50 hover:bg-white/90 dark:hover:bg-gray-900/75 h-full"
            >
               <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight">MSRC Blog</h3>
               <p className="mt-2 text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-[22ch]">Deep dives, disclosures & insights from the Microsoft Security Response Center team.</p>
            </Link>
          </div>
        </section>
        <div className="mt-12">
          <Link href="/home" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">← Back to Hub</Link>
        </div>
      </div>
    </main>
  );
}