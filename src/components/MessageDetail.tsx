import { format } from 'date-fns';

interface MessageDetailProps {
  messageId: string;
}

export function MessageDetail({ messageId }: MessageDetailProps) {
  return (
    <article className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Message ID: {messageId}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {format(new Date(), 'MMM d, yyyy')}
            </div>
            <div>
              <span className="font-medium">Published:</span>{' '}
              {format(new Date(), 'MMM d, yyyy')}
            </div>
          </div>
        </header>
        
        <div className="prose max-w-none">
          {/* Message content will be rendered here */}
        </div>
      </div>
    </article>
  );
} 