import { format } from 'date-fns';
import Link from 'next/link';
import { Message } from '@/lib/types';

interface MessageCardProps {
  message: Message;
}

export function MessageCard({ message }: MessageCardProps) {
  return (
    <Link href={`/message/${message.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{message.title}</h3>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID: {message.id}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {message.service.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 border border-primary-100 dark:border-primary-800"
              >
                {s}
              </span>
            ))}
          </div>
          
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <span>Updated: {format(new Date(message.lastUpdated), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <span>Published: {format(new Date(message.published), 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {message.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
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