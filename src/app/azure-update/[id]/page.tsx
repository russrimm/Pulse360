import { getAzureUpdates } from '@/lib/api';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { getProductIcon } from '@/lib/getProductIcon';

export const revalidate = 3600; // Revalidate every hour

export const metadata = {
  title: 'Azure Update | Microsoft 365 Message Center',
  description: 'View detailed information about Azure updates and changes.',
};

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AzureUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updates = await getAzureUpdates();
  const update = updates.find(u => u.id === id);

  if (!update) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/release-plans/azure"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Azure Updates
          </Link>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              {/* Move products here, above the title */}
              {update.products.length > 0 && (
                <div className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-6">
                  {update.products.map((product) => {
                    const iconPath = getProductIcon(product);
                    return (
                      <span
                        key={product}
                        className="inline-flex items-center gap-2 md:gap-3 px-3 py-1 md:px-6 md:py-3 rounded-lg md:rounded-2xl text-base md:text-xl font-bold bg-gray-50 text-gray-800 dark:bg-gray-700/70 dark:text-gray-100 border border-gray-200 md:border-2 md:border-gray-300 dark:border-gray-500 shadow md:shadow-lg"
                      >
                        {iconPath && (
                          <Image
                            src={iconPath}
                            alt=""
                            width={20}
                            height={20}
                            className="w-5 h-5 md:w-8 md:h-8"
                          />
                        )}
                        {product}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {update.productCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {category}
                  </span>
                ))}
              </div>

              {update.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {update.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-1.5 py-[1px] rounded-full text-[9px] font-medium tracking-wide whitespace-nowrap shrink-0 shadow-sm bg-gray-50/90 text-gray-600 dark:bg-gray-800/20 dark:text-gray-300 border border-gray-200/30 dark:border-gray-700/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {update.title}
              </h1>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-2 mb-2">
                <span>Created: {format(new Date(update.created), 'MMM d, yyyy')}</span>
                {format(new Date(update.created), 'yyyy-MM-dd') !== format(new Date(update.modified), 'yyyy-MM-dd') && (
                  <>
                    <span>•</span>
                    <span>Updated: {format(new Date(update.modified), 'MMM d, yyyy')}</span>
                  </>
                )}
              </div>
              {/* Availability dates under meta info */}
              {(update.generalAvailabilityDate || update.previewAvailabilityDate || update.privatePreviewAvailabilityDate) && (
                <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 gap-4 mb-2">
                  {update.generalAvailabilityDate && (
                    <span>
                      <span className="font-medium">General Availability:</span> {format(new Date(update.generalAvailabilityDate), 'MMMM yyyy')}
                    </span>
                  )}
                  {update.previewAvailabilityDate && (
                    <span>
                      <span className="font-medium">Preview:</span> {format(new Date(update.previewAvailabilityDate), 'MMMM yyyy')}
                    </span>
                  )}
                  {update.privatePreviewAvailabilityDate && (
                    <span>
                      <span className="font-medium">Private Preview:</span> {format(new Date(update.privatePreviewAvailabilityDate), 'MMMM yyyy')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="prose dark:prose-invert max-w-none [&_*]:!text-gray-700 [&_*]:dark:!text-gray-300 [&_a]:!text-primary-600 [&_a]:dark:!text-primary-400 [&_a]:!no-underline [&_a:hover]:!text-primary-700 [&_a:hover]:dark:!text-primary-300 [&_strong]:!text-gray-900 [&_strong]:dark:!text-white [&_h1]:!text-gray-900 [&_h1]:dark:!text-white [&_h2]:!text-gray-900 [&_h2]:dark:!text-white [&_h3]:!text-gray-900 [&_h3]:dark:!text-white [&_h4]:!text-gray-900 [&_h4]:dark:!text-white [&_h5]:!text-gray-900 [&_h5]:dark:!text-white [&_h6]:!text-gray-900 [&_h6]:dark:!text-white [&_code]:!text-gray-900 [&_code]:dark:!text-gray-100 [&_code]:!bg-gray-100 [&_code]:dark:!bg-gray-800 [&_pre]:!text-gray-900 [&_pre]:dark:!text-gray-100 [&_pre]:!bg-gray-100 [&_pre]:dark:!bg-gray-800 [&_p]:!text-gray-700 [&_p]:dark:!text-gray-300 [&_ul]:!text-gray-700 [&_ul]:dark:!text-gray-300 [&_ol]:!text-gray-700 [&_ol]:dark:!text-gray-300 [&_li]:!text-gray-700 [&_li]:dark:!text-gray-300 [&_blockquote]:!text-gray-700 [&_blockquote]:dark:!text-gray-300 [&_blockquote]:!border-gray-200 [&_blockquote]:dark:!border-gray-700 [&_*]:!bg-transparent [&_*]:dark:!bg-transparent">
              <div dangerouslySetInnerHTML={{ __html: update.description }} />
            </div>

            {/* Products */}
            {/* Removed Affected Products section, now handled above */}

            {/* Dates */}
            {/* Removed Availability section, now handled above */}
          </div>
        </div>
      </div>
    </div>
  );
} 