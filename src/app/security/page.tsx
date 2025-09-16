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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link
              href="/msrc"
              className="group flex flex-col rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/50 dark:focus-visible:ring-primary-800/50"
            >
               <div className="flex items-center justify-between">
                 <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 via-white to-white dark:from-primary-900/20 dark:via-gray-900 dark:to-gray-900 p-3 ring-1 ring-inset ring-primary-200/50 dark:ring-primary-800/40 shadow-sm">
                   <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true"><path fill="currentColor" d="M12 2 3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4Zm0 2.18 7 3.11v4.71c0 4.37-2.89 8.55-7 9.86-4.11-1.31-7-5.49-7-9.86V7.29l7-3.11ZM11 8v6h2V8h-2Zm0 8v2h2v-2h-2Z"/></svg>
                 </span>
                 <span className="text-primary-500 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all" aria-hidden="true">→</span>
               </div>
               <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">MSRC Portal</h3>
               <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Official Microsoft Security Response Center portal for vulnerability & security update information.</p>
               <span className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 inline-flex items-center">Open<span className="ml-1">→</span></span>
            </Link>
            <Link
              href="/msrc/blog"
              className="group flex flex-col rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300/50 dark:focus-visible:ring-primary-800/50"
            >
               <div className="flex items-center justify-between">
                 <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 via-white to-white dark:from-primary-900/20 dark:via-gray-900 dark:to-gray-900 p-3 ring-1 ring-inset ring-primary-200/50 dark:ring-primary-800/40 shadow-sm">
                   <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true"><path fill="currentColor" d="M5 3a2 2 0 0 0-2 2v13.5A2.5 2.5 0 0 0 5.5 21H18a2 2 0 0 0 2-2V7.414a2 2 0 0 0-.586-1.414l-2.414-2.414A2 2 0 0 0 15.586 3H5Zm0 2h9v4h4v10H5V5Zm2 3v2h8V8H7Zm0 4v2h6v-2H7Z"/></svg>
                 </span>
                 <span className="text-primary-500 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all" aria-hidden="true">→</span>
               </div>
               <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">MSRC Blog</h3>
               <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Deep dives, disclosures & insights from the Microsoft Security Response Center team.</p>
               <span className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 inline-flex items-center">Open<span className="ml-1">→</span></span>
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