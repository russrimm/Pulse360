import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Message } from '@/lib/types';
import Image from 'next/image';

interface MessageCardProps {
  message: Message;
  onClick: (messageId: string) => void;
}

// Map of service names to their icon paths
const serviceIcons: Record<string, string> = {
  'Power Apps': '/icons/PowerApps_scalable.svg',
  'Microsoft Power Automate': '/icons/PowerAutomate_scalable.svg',
  'Power Platform': '/icons/PowerPlatform_scalable.svg',
  'Microsoft Dataverse': '/icons/Dataverse_scalable.svg',
  'Power BI': '/icons/PowerBI_scalable.svg',
  'Microsoft Teams': '/icons/teams.svg',
  'SharePoint Online': '/icons/sharepoint.svg',
  'Microsoft 365': '/icons/m365.svg',
  'Microsoft 365 Apps': '/icons/m365.svg',
  'Microsoft 365 for Business': '/icons/m365.svg',
  'Microsoft 365 for Enterprise': '/icons/m365.svg',
  'Microsoft 365 for Education': '/icons/m365.svg',
  'Microsoft 365 for Government': '/icons/m365.svg',
  'OneDrive for Business': '/icons/onedrive.svg',
  'Microsoft Stream': '/icons/stream.svg',
  'Exchange Online': '/icons/exchange.svg',
  'Microsoft Forms': '/icons/forms.svg',
  'Microsoft Intune': '/icons/intune.svg',
  'Planner': '/icons/planner.svg',
  'Microsoft Entra': '/icons/entra.svg',
  'Microsoft Bookings': '/icons/Bookings.svg',
  'Dynamics 365 Apps': '/icons/Dynamics365_scalable.svg',
  'Microsoft Viva': '/icons/viva.svg',
  'Microsoft Purview': '/icons/purview.svg',
  'Microsoft Defender XDR': '/icons/defender.svg',
  'Windows': '/icons/Windows.svg',
  'Microsoft Power Automate in Microsoft 365': '/icons/PowerAutomate_scalable.svg',
  'Power Apps in Microsoft 365': '/icons/PowerApps_scalable.svg'
};

// Normalize service names
const normalizeService = (service: string): string => {
  // Return the service name as is
  return service;
};

export const MessageCard: React.FC<MessageCardProps> = ({ message, onClick }) => {
  const handleClick = () => {
    onClick(message.id);
  };

  // Deduplicate and normalize services
  const uniqueServices = Array.from(new Set(message.service.map(normalizeService)));

  return (
    <Link href={`/message/${message.id}`}>
      <div 
        className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full cursor-pointer flex flex-col"
        onClick={handleClick}
      >
        {message.isMajorChange && (
          <div className="w-full bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 animate-pulse-subtle">
            <div className="flex items-center justify-center py-1.5">
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 dark:text-red-300">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Major Change
              </span>
            </div>
          </div>
        )}
        <div className="flex flex-col p-3 pb-1 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
              {message.id}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {uniqueServices.map((service) => {
                const iconPath = service.startsWith('Microsoft 365') 
                  ? '/icons/m365.svg' 
                  : serviceIcons[service];
                return (
                  <div
                    key={service}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-transparent dark:text-blue-300 border border-blue-200 dark:border-blue-800 min-w-[100px] justify-center"
                  >
                    {iconPath && (
                      <Image
                        src={iconPath}
                        alt={service}
                        width={10}
                        height={10}
                        className="mr-0.5 w-2.5 h-2.5"
                      />
                    )}
                    <span className="truncate">{service}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400 gap-1.5">
            <span className="font-medium">Published</span>
            <span>{format(new Date(message.published), 'MMM d, yyyy')}</span>
            {format(new Date(message.published), 'MMM d, yyyy') !== format(new Date(message.lastUpdated), 'MMM d, yyyy') && (
              <>
                <span>•</span>
                <span className="font-medium">Updated</span>
                <span>{format(new Date(message.lastUpdated), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </div>
        <div className="p-6 pt-4 flex flex-col flex-grow">
          {message.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-2 -mt-1">
              {message.tags.map((tag) => {
                // Map tags to appropriate icons
                const getTagIcon = (tag: string) => {
                  const tagLower = tag.toLowerCase();
                  if (tagLower.includes('feature')) return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
                  if (tagLower.includes('security')) return 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z';
                  if (tagLower.includes('update')) return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15';
                  if (tagLower.includes('deprecation')) return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
                  if (tagLower.includes('new')) return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
                  if (tagLower.includes('change')) return 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4';
                  return 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z';
                };

                const getTagStyle = (tag: string) => {
                  const tagLower = tag.toLowerCase();
                  if (tagLower.includes('new feature')) return 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-200/30 dark:border-emerald-700/20';
                  if (tagLower.includes('update')) return 'bg-teal-50/90 text-teal-700 dark:bg-teal-900/20 dark:text-teal-200 border border-teal-200/30 dark:border-teal-700/20';
                  if (tagLower.includes('user impact')) return 'bg-amber-50/90 text-amber-700 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200/30 dark:border-amber-700/20';
                  if (tagLower.includes('admin impact')) return 'bg-orange-50/90 text-orange-700 dark:bg-orange-900/20 dark:text-orange-200 border border-orange-200/30 dark:border-orange-700/20';
                  return 'bg-gray-50/90 text-gray-600 dark:bg-gray-800/20 dark:text-gray-300 border border-gray-200/30 dark:border-gray-700/20';
                };

                const getTagText = (tag: string) => {
                  const tagLower = tag.toLowerCase();
                  if (tagLower.includes('new feature')) return 'New';
                  if (tagLower.includes('update')) return 'Updated';
                  return tag;
                };

                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center px-1.5 py-[1px] rounded-full text-[9px] font-medium tracking-wide whitespace-nowrap shrink-0 shadow-sm hover:shadow transition-all duration-200 ${getTagStyle(tag)}`}
                  >
                    <svg
                      className="w-2 h-2 mr-0.5 text-current opacity-70"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={getTagIcon(tag)}
                      />
                    </svg>
                    {getTagText(tag)}
                  </span>
                );
              })}
            </div>
          )}
          
          <div className="flex flex-col flex-grow justify-start">
            <div className="flex items-start gap-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors tracking-tight">{message.title}</h3>
              {message.severity && message.severity.toLowerCase() !== 'normal' && (
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ml-1 bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700"
                  aria-label="Critical Alert"
                >
                  Critical Alert
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}; 