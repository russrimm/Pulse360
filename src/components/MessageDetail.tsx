import { format } from 'date-fns';
import { Message } from '@/lib/types';

interface MessageDetailProps {
  message: Message;
}

export function MessageDetail({ message }: MessageDetailProps) {
  return (
    <article className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {message.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {format(new Date(message.lastUpdated), 'MMM d, yyyy')}
            </div>
            <div>
              <span className="font-medium">Published:</span>{' '}
              {format(new Date(message.published), 'MMM d, yyyy')}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {message.service.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {message.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>
        
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: message.content }} />
      </div>
    </article>
  );
} 