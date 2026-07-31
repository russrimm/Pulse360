'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Route rendering failed:', error);
  }, [error]);

  return (
    <section
      className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-6 text-center"
      role="alert"
    >
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        This page could not be loaded
      </h1>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
        The upstream Microsoft service may be temporarily unavailable. Existing navigation remains
        available while you retry.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        Try again
      </button>
    </section>
  );
}
