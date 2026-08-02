export default function Loading() {
  return (
    <main
      className="flex min-h-[50vh] items-center justify-center px-6 text-gray-700 dark:text-gray-300"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 motion-reduce:animate-none dark:border-primary-800 dark:border-t-primary-400"
          aria-hidden="true"
        />
        <p className="text-sm">Loading Pulse 360…</p>
      </div>
    </main>
  );
}
