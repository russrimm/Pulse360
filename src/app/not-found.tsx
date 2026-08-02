import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
        This update could not be found
      </h1>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        It may have been removed from its Microsoft source, or the link may be incorrect.
      </p>
      <Link
        href="/home"
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        Back to Pulse 360
      </Link>
    </main>
  );
}
