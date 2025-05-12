import { format } from 'date-fns';
import Link from 'next/link';
import { Message } from '@/lib/types';

interface MessageCardProps {
  message: Message;
}

export function MessageCard({ message }: MessageCardProps) {
  return (
    <Link href={`/message/${message.id}`}>
      <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 rounded-lg border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{message.title}</h3>
            <span className="text-xs font-medium text-gray-500">ID: {message.id}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {message.service.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
              >
                {s}
              </span>
            ))}
          </div>
          
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Updated: {format(new Date(message.lastUpdated), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Published: {format(new Date(message.published), 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {message.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200"
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