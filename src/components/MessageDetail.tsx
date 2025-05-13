'use client';

import { format } from 'date-fns';
import { Message } from '@/lib/types';
import Link from 'next/link';
import { useState } from 'react';
import { ImageModal } from './ImageModal';

interface MessageDetailProps {
  message: Message;
}

export function MessageDetail({ message }: MessageDetailProps) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setSelectedImage({ src: img.src, alt: img.alt });
  };

  const processContent = (content: string) => {
    const patterns = [
      '[When this will happen:]',
      '[How this will affect your organization:]',
      '[What you need to do to prepare:]'
    ];

    let processedContent = content;
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'g');
      const replacement = pattern.replace(/[\[\]]/g, '');
      processedContent = processedContent.replace(regex, `<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">${replacement}</h2>`);
    });

    return processedContent;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {selectedImage && (
        <ImageModal
          src={selectedImage.src}
          alt={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}
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
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">{message.id} - {message.title}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Message ID</h3>
              <p className="text-base text-gray-900 dark:text-white">{message.id}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Service</h3>
              <div className="max-h-[140px] overflow-y-auto">
                {message.service.map((s) => (
                  <span
                    key={s}
                    className="inline-block text-base text-gray-900 dark:text-white mb-1"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Published</h3>
              <p className="text-base text-gray-900 dark:text-white">
                {format(new Date(message.published), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Action Required By</h3>
              <p className="text-base text-gray-900 dark:text-white">
                {message.actionRequiredByDateTime
                  ? format(new Date(message.actionRequiredByDateTime), 'MMM d, yyyy')
                  : 'Not specified'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</h3>
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

          {message.details?.find(d => d.name === 'Platforms') && (
            <div className="mb-8">
              <div className="w-[250px] rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Platforms</h2>
                <div className="flex flex-wrap gap-2">
                  {message.details.find(d => d.name === 'Platforms')?.value.split(',').map((platform) => (
                    <span
                      key={platform}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-base font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 border border-primary-100 dark:border-primary-800"
                    >
                      {platform.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {message.details?.filter(d => d.name !== 'Platforms').length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="pt-6">
                <div className="grid gap-4">
                  {message.details?.filter(d => d.name !== 'Platforms').map((detail) => (
                    <div key={detail.name} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 capitalize">{detail.name}</h3>
                      <p className="text-xl text-gray-900 dark:text-gray-100">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-6">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none prose-blue prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-white prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 [&_*]:text-gray-600 dark:[&_*]:text-white [&_a]:text-primary-600 dark:[&_a]:text-primary-400 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'IMG') {
                  handleImageClick(e as React.MouseEvent<HTMLImageElement>);
                }
              }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">More information</h2>
              <div dangerouslySetInnerHTML={{ __html: processContent(message.content) }} />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
} 