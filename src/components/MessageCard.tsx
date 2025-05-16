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

// Normalize service names
const normalizeService = (service: string): string => {
  if (service.includes('365')) return 'Microsoft 365';
  if (service.includes('Power Apps')) return 'Power Apps';
  if (service.includes('Power Automate')) return 'Power Automate';
  if (service.includes('Forms')) return 'Microsoft Forms';
  if (service.includes('Stream')) return 'Microsoft Stream';
  if (service.includes('Intune')) return 'Microsoft Intune';
  if (service.includes('Planner')) return 'Microsoft Planner';
  if (service.includes('Entra')) return 'Microsoft Entra';
  if (service.includes('Dynamics')) return 'Dynamics 365 Apps';
  if (service.includes('Viva')) return 'Microsoft Viva';
  if (service.includes('Purview')) return 'Microsoft Purview';
  if (service.includes('Defender')) return 'Microsoft Defender XDR';
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
        className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full cursor-pointer"
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
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
              {message.id}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {uniqueServices.map((service) => {
              const iconPath = serviceIcons[service];
              return (
                <div
                  key={service}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 dark:bg-transparent dark:text-blue-300 border border-blue-200 dark:border-blue-800 min-w-[200px] justify-center"
                >
                  {iconPath && (
                    <Image
                      src={iconPath}
                      alt={service}
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                  )}
                  <span className="truncate">{service}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{message.title}</h3>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-6">
            <div className="flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Published: {format(new Date(message.published), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Updated: {format(new Date(message.lastUpdated), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}; 