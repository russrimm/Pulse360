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
  'Windows': '/icons/Windows.svg',
  'Azure Databricks': '/icons/databricks.svg'
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
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-3xl mb-4">
        <Link
          href="/message-center"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Message Center
        </Link>
      </div>
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden relative">
        {/* Meta info row */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-6 pb-2 border-b border-gray-100 dark:border-gray-800">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
            {message.id}
          </span>
          <div className="flex items-center gap-2">
            {message.isMajorChange && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 animate-pulse-subtle">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Major Change
              </span>
            )}
            {message.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
        {/* Product row */}
        <div className="flex items-center gap-4 px-6 pt-4 pb-2">
          {uniqueServices.map(service => {
            const iconPath = service.startsWith('Microsoft 365') ? '/icons/m365.svg' : serviceIcons[service]
            return (
              <span key={service} className="flex items-center gap-2">
                {iconPath && (
                  <Image src={iconPath} alt={service} width={28} height={28} className="w-7 h-7" />
                )}
                <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">{service}</span>
              </span>
            )
          })}
        </div>
        {/* Title */}
        <h1 className="px-6 pt-2 pb-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
          {message.title}
        </h1>
        {/* Dates */}
        <div className="flex flex-wrap gap-4 px-6 pb-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Published: {formatDate(message.published)}</span>
          {!isSameDate(message.published, message.lastUpdated) && (
            <span>Last updated: {formatDate(message.lastUpdated)}</span>
          )}
          {message.actionRequiredByDateTime && (
            <span className="text-red-600 dark:text-red-400 font-semibold">Action required by: {formatDate(message.actionRequiredByDateTime)}</span>
          )}
        </div>
        {/* Platforms */}
        {platformDetails && (
          <div className="px-6 pb-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">Impacted Platforms:</span>
              {platformDetails.split(',').map(platform => (
                <span key={platform} className="inline-flex items-center px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-medium">
                  {platform.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Details grid */}
        {otherDetails && otherDetails.length > 0 && (
          <div className="px-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherDetails.map(detail => (
              <div key={detail.name} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{detail.name}</div>
                <div className="text-sm text-gray-900 dark:text-gray-100">{detail.value}</div>
              </div>
            ))}
          </div>
        )}
        {/* Main content */}
        <div className="px-6 pb-8 pt-4">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-blue prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-white prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 [&_*]:text-gray-600 dark:[&_*]:text-white [&_a]:text-primary-600 dark:[&_a]:text-primary-400 bg-white dark:bg-gray-900 rounded-xl p-4 overflow-x-auto shadow-sm" onClick={e => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') handleImageClick(e as React.MouseEvent<HTMLImageElement>);
          }}>
            <div className="break-words break-all [&_*]:break-words [&_*]:break-all [&_p]:whitespace-normal [&_*]:whitespace-normal [&_*]:overflow-wrap-anywhere" dangerouslySetInnerHTML={{ __html: processedContent }} />
          </div>
        </div>
      </div>
      {selectedImage && (
        <ImageModal src={selectedImage.src} alt={selectedImage.alt} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
} 