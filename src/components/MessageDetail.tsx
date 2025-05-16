'use client';

import { format } from 'date-fns';
import { Message } from '@/lib/types';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { ImageModal } from './ImageModal';
import Image from 'next/image';
import { LoadingSpinner } from './LoadingSpinner';

// Map of service names to their icon paths
const serviceIcons: Record<string, string> = {
  'Power Apps': '/icons/PowerApps_scalable.svg',
  'Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Power Platform': '/icons/PowerPlatform_scalable.svg',
  'Microsoft Dataverse': '/icons/Dataverse_scalable.svg',
  'Power BI': '/icons/PowerBI_scalable.svg',
  'Microsoft Teams': '/icons/teams.svg',
  'SharePoint Online': '/icons/sharepoint.svg',
  'Microsoft 365': '/icons/m365.svg',
  'OneDrive for Business': '/icons/onedrive.svg',
  'Microsoft Stream': '/icons/stream.svg',
  'Exchange Online': '/icons/exchange.svg',
  'Microsoft Forms': '/icons/forms.svg',
  'Microsoft Intune': '/icons/intune.svg',
  'Microsoft Planner': '/icons/planner.svg',
  'Microsoft Entra': '/icons/entra.svg',
  'Dynamics 365 Apps': '/icons/Dynamics365_scalable.svg',
  'Microsoft Viva': '/icons/viva.svg',
  'Microsoft Purview': '/icons/purview.svg',
  'Microsoft Defender XDR': '/icons/defender.svg',
  'Windows': '/icons/Windows.svg'
};

interface MessageDetailProps {
  message: Message;
}

export function MessageDetail({ message }: MessageDetailProps) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for images and content
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setSelectedImage({ src: img.src, alt: img.alt });
  };

  const processedContent = useMemo(() => {
    const patterns = [
      '[When this will happen:]',
      '[How this will affect your organization:]',
      '[What you need to do to prepare:]'
    ];

    // Create a single regex pattern for all replacements
    const regex = new RegExp(patterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    
    return message.content.replace(regex, (match) => {
      const text = match.replace(/[\[\]]/g, '');
      return `<h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">${text}</h2>`;
    });
  }, [message.content]);

  // Get unique services
  const uniqueServices = Array.from(new Set(message.service));

  return (
    <div className="min-h-screen">
      {isLoading && <LoadingSpinner />}
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
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

          <article className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-3 sm:p-8">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">{message.title}</h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
                {message.isMajorChange && (
                  <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 p-2 sm:p-3">
                    <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1 sm:mb-2">Status</h3>
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-sm sm:text-base font-medium bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                      Major Change
                    </span>
                  </div>
                )}
                <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 p-2 sm:p-3 flex items-center justify-center">
                  <p className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center">{message.id}</p>
                </div>
                <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 p-1.5 sm:p-3">
                  <div className="flex flex-wrap gap-1 sm:gap-2 justify-center items-center">
                    {uniqueServices.map((service) => {
                      const iconPath = serviceIcons[service];
                      return (
                        <span
                          key={service}
                          className="inline-flex items-center px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-xl text-base sm:text-2xl font-medium bg-blue-50 text-blue-700 dark:bg-transparent dark:text-blue-300"
                        >
                          {iconPath && (
                            <Image
                              src={iconPath}
                              alt={service}
                              width={20}
                              height={20}
                              className="mr-1 sm:mr-2 w-5 h-5 sm:w-10 sm:h-10"
                            />
                          )}
                          {service}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 p-2 sm:p-3 flex flex-col justify-between">
                  <div className="flex items-center">
                    <span className="w-20 sm:w-24 text-xs sm:text-sm font-medium text-primary-600 dark:text-primary-400">Published:</span>
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white ml-2 sm:ml-4">
                      {format(new Date(message.published), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center mt-1 sm:mt-2">
                    <span className="w-20 sm:w-24 text-xs sm:text-sm font-medium text-primary-600 dark:text-primary-400">Updated:</span>
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white ml-2 sm:ml-4">
                      {format(new Date(message.lastUpdated), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {message.actionRequiredByDateTime && (
                  <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 p-3">
                    <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">Action Required By</h3>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {format(new Date(message.actionRequiredByDateTime), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 p-3">
                  <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">Tags</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {message.tags.map((tag) => (
                      <div key={tag} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tag}</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {message.details?.find(d => d.name === 'Platforms')?.value && (
                  <div className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 p-4">
                    <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">Platforms</h3>
                    <div className="flex flex-wrap gap-2">
                      {message.details?.find(d => d.name === 'Platforms')?.value.split(',').map((platform) => (
                        <span
                          key={platform}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 border border-primary-100 dark:border-primary-800"
                        >
                          {platform.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.details?.filter(d => d.name !== 'Platforms').length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-6">
                    <div className="grid gap-4">
                      {message.details?.filter(d => d.name !== 'Platforms').map((detail) => (
                        <div key={detail.name} className="bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                          <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent mb-2 capitalize">{detail.name}</h3>
                          <p className="text-xl text-gray-900 dark:text-gray-100">{detail.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6">
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none prose-blue prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-white prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 [&_*]:text-gray-600 dark:[&_*]:text-white [&_a]:text-primary-600 dark:[&_a]:text-primary-400 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 p-6"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'IMG') {
                      handleImageClick(e as React.MouseEvent<HTMLImageElement>);
                    }
                  }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent mb-6">More information</h2>
                  <div dangerouslySetInnerHTML={{ __html: processedContent }} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
} 