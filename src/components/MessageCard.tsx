import { format } from 'date-fns';
import Link from 'next/link';
import { Message } from '@/lib/types';

interface MessageCardProps {
  message: Message;
}

export function MessageCard({ message }: MessageCardProps) {
  return (
    <Link href={`/message/${message.id}`}>
      <div className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full">
        <div className="p-6">
          <div className="flex flex-col mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium text-gray-500 dark:text-white">{message.id}</span>
              {message.isMajorChange && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
                  Major Change
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{message.title}</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {message.service.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50/80 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-100/50 dark:border-primary-800/50 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              >
                {s}
              </span>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Published: {format(new Date(message.published), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Updated: {format(new Date(message.lastUpdated), 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {message.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50/80 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
} 