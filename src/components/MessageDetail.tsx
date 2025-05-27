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
  'Microsoft Bookings': '/icons/Bookings.svg',
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

  // Format date helper
  const formatDate = (date: string) => format(new Date(date), 'MMM d, yyyy');

  // Check if dates are the same
  const isSameDate = (date1: string, date2: string) => formatDate(date1) === formatDate(date2);

  // Get unique services
  const uniqueServices = useMemo(() => Array.from(new Set(message.service)), [message.service]);

  // Get platform details
  const platformDetails = useMemo(() => 
    message.details?.find(d => d.name === 'Platforms')?.value,
    [message.details]
  );

  // Get other details (excluding Platforms)
  const otherDetails = useMemo(() => 
    message.details?.filter(d => d.name !== 'Platforms'),
    [message.details]
  );

  useEffect(() => {
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="relative px-3 sm:px-6 lg:px-8 pt-0 pb-2 sm:py-4">
        <div className="max-w-7xl mx-auto">
          {selectedImage && (
            <ImageModal
              src={selectedImage.src}
              alt={selectedImage.alt}
              onClose={() => setSelectedImage(null)}
            />
          )}
          
          <Link
            href="/"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 mb-4"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to messages
          </Link>

          {/* Product/Tag Tab attached to More Information box */}
          <div className="flex justify-center mb-0">
            <div className="relative z-10 -mb-4 flex items-center rounded-t-2xl shadow-lg border-x-2 border-t-2 border-b-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-4 min-h-[72px]">
              {uniqueServices.map((service, idx) => {
                const iconPath = service.startsWith('Microsoft 365') ? '/icons/m365.svg' : serviceIcons[service]
                return (
                  <span key={service} className="flex items-center gap-3 mr-8">
                    <span className="inline-flex items-center px-5 py-2 rounded-2xl bg-white dark:bg-gray-800 border-2 border-blue-500 shadow-md">
                      {iconPath && (
                        <Image
                          src={iconPath}
                          alt={service}
                          width={40}
                          height={40}
                          className="w-10 h-10 mr-3"
                        />
                      )}
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-300 drop-shadow-sm">
                        {service}
                      </span>
                    </span>
                  </span>
                )
              })}
              {message.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-4">
                  {message.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-3 py-1 rounded-lg text-base font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <article className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-1.5 sm:p-6">
              {message.isMajorChange && (
                <div className="w-full bg-red-50/50 dark:bg-red-900/20 border-b border-red-200/50 dark:border-red-800/50 animate-pulse-subtle mb-2">
                  <div className="flex items-center justify-center py-1.5">
                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700/90 dark:text-red-300/90">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Major Change
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center mb-0">
                <div className="flex flex-col items-center">
                  <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent text-center">
                    {message.id} - {message.title}
                  </h1>
                </div>
              </div>

              {platformDetails && (
                <div className="bg-white dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden mb-4 sm:mb-6 p-3 sm:p-4">
                  <h3 className="text-base font-medium text-primary-600 dark:text-primary-400 mb-2">Impacted Platforms</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {platformDetails.split(',').map((platform) => (
                      <span
                        key={platform}
                        className="inline-flex items-center px-2 py-1 rounded-lg text-base font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                      >
                        {platform.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {message.actionRequiredByDateTime && (
                <div className="bg-white dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden mb-4 sm:mb-6 p-3 sm:p-4">
                  <span className="w-24 text-base font-medium text-primary-600 dark:text-primary-400">Action Required</span>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {formatDate(message.actionRequiredByDateTime)}
                  </p>
                </div>
              )}

              {otherDetails && otherDetails.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-3 sm:pt-4">
                    <div className="grid gap-2 sm:gap-3">
                      {otherDetails.map((detail) => (
                        <div key={detail.name} className="bg-white dark:bg-gray-700/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
                          <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent mb-2 capitalize">{detail.name}</h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100">{detail.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 sm:pt-4">
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none prose-blue prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-white prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 [&_*]:text-gray-600 dark:[&_*]:text-white [&_a]:text-primary-600 dark:[&_a]:text-primary-400 bg-white dark:bg-gray-700/70 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-600 p-2 sm:p-4 overflow-x-auto"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'IMG') {
                      handleImageClick(e as React.MouseEvent<HTMLImageElement>);
                    }
                  }}
                >
                  <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent mb-3 sm:mb-4">More information</h2>
                  <div className="break-words break-all [&_*]:break-words [&_*]:break-all [&_p]:whitespace-normal [&_*]:whitespace-normal [&_*]:overflow-wrap-anywhere" dangerouslySetInnerHTML={{ __html: processedContent }} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
} 