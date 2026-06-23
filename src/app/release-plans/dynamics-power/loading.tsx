import React from 'react';

// Lightweight loading skeleton for /release-plans/dynamics-power
// Renders two placeholder cards (Power Platform / Dynamics 365) with animated shimmer blocks
// so navigation does not feel like a flicker during the server data fetch.

function ShimmerBar({ className }: { className?: string }) {
  return <div className={`rounded-md bg-gray-200/70 dark:bg-gray-700/50 animate-pulse ${className || 'h-4'}`} aria-hidden="true" />;
}

export default function Loading() {
  return (
    <main className="w-full flex flex-col items-center bg-gradient-to-b from-white via-gray-50 to-white dark:from-black dark:via-gray-900 dark:to-black pt-10 pb-24">
      <div className="w-full max-w-7xl px-4 md:px-8">
        <header className="mb-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Dynamics & Power Platform Roadmap</h1>
          <p className="mt-3 text-sm md:text-base text-gray-500 dark:text-gray-400">Loading release plans…</p>
        </header>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {["Power Platform", "Dynamics 365"].map(label => (
            <section
              key={label}
              className="flex flex-col rounded-3xl border border-gray-200/60 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg shadow-[0_4px_18px_-6px_rgba(0,0,0,0.20)] dark:shadow-[0_6px_30px_-10px_rgba(0,0,0,0.70)] p-5 md:p-6"
              aria-busy="true"
              aria-labelledby={`loading-${label.replace(/\s+/g,'-').toLowerCase()}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 id={`loading-${label.replace(/\s+/g,'-').toLowerCase()}`} className="text-base md:text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  {label}
                  <span className="ml-2 text-xs md:text-sm font-medium text-gray-400 dark:text-gray-500">Loading…</span>
                </h2>
              </div>
              <div className="mt-3 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-gray-100/60 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/40 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-gray-200/70 dark:bg-gray-700/50 animate-pulse" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <ShimmerBar className="h-3 w-3/4" />
                        <div className="flex gap-2 pt-1">
                          <ShimmerBar className="h-3 w-16" />
                          <ShimmerBar className="h-3 w-12" />
                          <ShimmerBar className="h-3 w-10" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
