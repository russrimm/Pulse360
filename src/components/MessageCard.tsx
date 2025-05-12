import { format } from 'date-fns';
import Link from 'next/link';

interface MessageCardProps {
  id: string;
  title: string;
  service: string[];
  lastUpdated: string;
  published: string;
  tags: string[];
}

export function MessageCard({
  id,
  title,
  service,
  lastUpdated,
  published,
  tags,
}: MessageCardProps) {
  return (
    <Link href={`/message/${id}`}>
      <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {service.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {s}
              </span>
            ))}
          </div>
          <div className="text-sm text-gray-500">
            <p>Last Updated: {format(new Date(lastUpdated), 'MMM d, yyyy')}</p>
            <p>Published: {format(new Date(published), 'MMM d, yyyy')}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
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