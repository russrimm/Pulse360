import { format } from 'date-fns';
import { Message } from '@/lib/types';
import Link from 'next/link';

interface MessageDetailProps {
  message: Message;
}

export function MessageDetail({ message }: MessageDetailProps) {
  return (
    <article className="bg-white shadow-sm rounded-lg border border-gray-100">
      <div className="p-6">
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            Back to messages
          </Link>
          
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{message.title}</h1>
            <span className="text-sm font-medium text-gray-500">ID: {message.id}</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <span>Last Updated: {format(new Date(message.lastUpdated), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <span>Published: {format(new Date(message.published), 'MMM d, yyyy')}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
        
        <div className="prose max-w-none prose-blue prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-blue-600 prose-strong:text-gray-900">
          <div dangerouslySetInnerHTML={{ __html: message.content }} />
        </div>
      </div>
    </article>
  );
} 