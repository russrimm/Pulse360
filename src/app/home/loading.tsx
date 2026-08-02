export default function Loading() {
  const cards = [
    { titleWidth: 'w-32', descriptionWidth: 'w-11/12' },
    { titleWidth: 'w-28', descriptionWidth: 'w-4/5' },
    { titleWidth: 'w-28', descriptionWidth: 'w-4/5' },
    { titleWidth: 'w-40', descriptionWidth: 'w-5/6' },
  ];

  return (
    <main
      className="relative min-h-full overflow-hidden bg-slate-50 text-slate-950 dark:bg-neutral-950 dark:text-white"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading Pulse 360</span>
      <div
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      <div
        className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
        aria-hidden="true"
      >
        <header className="mb-8 max-w-3xl animate-pulse sm:mb-10">
          <div className="mb-3 flex h-4 items-center">
            <div className="h-3 w-52 rounded bg-slate-200 dark:bg-neutral-800" />
          </div>
          <div className="mt-3 max-w-2xl">
            <div className="flex h-6 items-center">
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-neutral-800" />
            </div>
            <div className="flex h-6 items-center">
              <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-neutral-800" />
            </div>
            <div className="flex h-6 items-center sm:hidden">
              <div className="h-4 w-2/5 rounded bg-slate-200 dark:bg-neutral-800" />
            </div>
          </div>
        </header>

        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
              <div
                key={index}
                className="relative flex min-h-64 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-slate-200 dark:bg-neutral-700" />
                <div className="flex flex-1 animate-pulse flex-col">
                  <div className="mt-5 h-16 w-28 rounded bg-slate-200 dark:bg-neutral-800" />
                  <div className="pt-6">
                    <div className="flex h-7 items-center">
                      <div
                        className={`h-5 rounded bg-slate-200 dark:bg-neutral-800 ${card.titleWidth}`}
                      />
                    </div>
                    <div className="mt-2">
                      <div className="flex h-6 items-center">
                        <div className="h-3 w-full rounded bg-slate-200 dark:bg-neutral-800" />
                      </div>
                      <div className="flex h-6 items-center">
                        <div
                          className={`h-3 rounded bg-slate-200 dark:bg-neutral-800 ${card.descriptionWidth}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex h-6 animate-pulse items-center">
                  <div className="h-4 w-20 rounded bg-slate-200 dark:bg-neutral-800" />
                </div>
              </div>
            ))}

            <div className="relative flex min-h-64 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-4 lg:min-h-52">
              <div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-blue-200 dark:bg-blue-900" />
              <div className="flex flex-1 animate-pulse items-center gap-6">
                <div className="h-14 w-14 shrink-0 rounded-lg bg-blue-100 dark:bg-blue-950" />
                <div className="w-full max-w-2xl">
                  <div className="flex h-7 items-center">
                    <div className="h-5 w-48 max-w-full rounded bg-slate-200 dark:bg-neutral-800" />
                  </div>
                  <div className="flex h-7 items-center sm:hidden">
                    <div className="h-5 w-24 rounded bg-slate-200 dark:bg-neutral-800" />
                  </div>
                  <div className="mt-2">
                    <div className="flex h-6 items-center">
                      <div className="h-3 w-full rounded bg-slate-200 dark:bg-neutral-800" />
                    </div>
                    <div className="flex h-6 items-center">
                      <div className="h-3 w-full rounded bg-slate-200 dark:bg-neutral-800" />
                    </div>
                    <div className="flex h-6 items-center sm:hidden">
                      <div className="h-3 w-full rounded bg-slate-200 dark:bg-neutral-800" />
                    </div>
                    <div className="flex h-6 items-center sm:hidden">
                      <div className="h-3 w-3/5 rounded bg-slate-200 dark:bg-neutral-800" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex h-6 animate-pulse items-center">
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-neutral-800" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
