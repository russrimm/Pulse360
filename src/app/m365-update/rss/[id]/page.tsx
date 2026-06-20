import { getM365Update } from '@/lib/api.server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ProductBadge } from '@/components/ProductBadge';

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function M365UpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const update = await getM365Update(id);

  if (!update) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/release-plans/m365"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Microsoft 365 Updates
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 sm:p-8">
            {/* Product Badge */}
            {update.product && (
              <div className="mb-4">
                <ProductBadge product={update.product} />
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {update.title}
            </h1>

            {/* Published Date */}
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Published {format(new Date(update.published), 'MMMM d, yyyy')}
            </div>

            {/* Content */}
            <div className="prose dark:prose-invert max-w-none">
              <div 
                className="text-gray-700 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: update.content }} 
              />
            </div>

            {/* Status */}
            {update.status && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status</h2>
                <p className="text-gray-700 dark:text-gray-300">{update.status}</p>
              </div>
            )}

            {/* Services */}
            {update.service && update.service.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Affected Services</h2>
                <div className="flex flex-wrap gap-2">
                  {update.service.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Availability</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {update.generalAvailabilityDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">General Availability</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(update.generalAvailabilityDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
                {update.previewAvailabilityDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(update.previewAvailabilityDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {update.tags && update.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {update.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 