export default function ServiceHealthLoading() {
  return (
    <div className="min-h-screen" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading Microsoft 365 Service Health…</span>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 animate-pulse">
          <div className="h-4 w-16 rounded bg-surface-sunken" />
          <div className="mt-3 h-9 w-80 max-w-full rounded bg-surface-sunken" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-surface-sunken" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(item => (
            <div key={item} className="h-20 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
