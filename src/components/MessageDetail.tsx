import { format } from 'date-fns';
import { Message } from '@/lib/types';
import Link from 'next/link';

interface MessageDetailProps {
  message: Message;
}

export function MessageDetail({ message }: MessageDetailProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to messages
        </Link>
      </div>

      <article className="rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 sm:p-8">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-8">{message.id} - {message.title}</h1>

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="w-[250px] h-[250px] rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Message ID</h2>
              <p className="text-3xl text-gray-900 dark:text-gray-100 font-sans break-all">{message.id}</p>
            </div>

            <div className="w-[250px] h-[250px] rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Service</h2>
              <div className="flex flex-wrap gap-2">
                {message.service.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-base font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 border border-primary-100 dark:border-primary-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-[250px] h-[250px] rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Published</h2>
              <p className="text-xl text-gray-900 dark:text-gray-100">{format(new Date(message.published), 'MMMM d, yyyy')}</p>
            </div>

            <div className="w-[250px] h-[250px] rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {message.isMajorChange && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-base font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800">
                    Major Change
                  </span>
                )}
                {message.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-base font-medium bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="pt-6">
              <div className="grid gap-4">
                {message.details?.map((detail) => (
                  <div key={detail.name} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 capitalize">{detail.name}</h3>
                    <p className="text-xl text-gray-900 dark:text-gray-100">{detail.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="pt-6">
              <div className="prose prose-lg dark:prose-invert max-w-none prose-blue prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-white prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 [&_*]:text-gray-600 dark:[&_*]:text-white [&_a]:text-primary-600 dark:[&_a]:text-primary-400 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">More information</h2>
                <div dangerouslySetInnerHTML={{ __html: message.content }} />
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
} 