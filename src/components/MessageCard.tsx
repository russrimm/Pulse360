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

// Map of tag names to their icon paths and colors
const tagIcons: Record<string, { icon: string; color: string }> = {
  'Security': { icon: '/icons/security.svg', color: 'red' },
  'Update': { icon: '/icons/update.svg', color: 'blue' },
  'New Feature': { icon: '/icons/feature.svg', color: 'green' },
  'Deprecation': { icon: '/icons/deprecation.svg', color: 'yellow' },
  'Bug Fix': { icon: '/icons/bug.svg', color: 'purple' },
  'Performance': { icon: '/icons/performance.svg', color: 'indigo' },
  'Compliance': { icon: '/icons/compliance.svg', color: 'pink' },
  'Integration': { icon: '/icons/integration.svg', color: 'teal' },
  'API': { icon: '/icons/api.svg', color: 'orange' },
  'UI': { icon: '/icons/ui.svg', color: 'cyan' },
  'Mobile': { icon: '/icons/mobile.svg', color: 'emerald' },
  'Desktop': { icon: '/icons/desktop.svg', color: 'violet' },
  'Cloud': { icon: '/icons/cloud.svg', color: 'sky' },
  'On-Premises': { icon: '/icons/onprem.svg', color: 'amber' },
  'Preview': { icon: '/icons/preview.svg', color: 'rose' },
  'GA': { icon: '/icons/ga.svg', color: 'lime' }
};

// Color mapping for tag pills
const tagColors: Record<string, { bg: string; text: string; border: string }> = {
  'red': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'blue': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'green': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'yellow': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'purple': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'indigo': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'pink': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'teal': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'orange': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'cyan': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'emerald': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'violet': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'sky': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'amber': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'rose': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'lime': { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' }
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
        <div className="p-6">
          <div className="flex flex-col mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 to-primary-600/20 dark:from-primary-400/20 dark:to-primary-300/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-300 rounded-lg blur opacity-30" />
                  <span className="relative inline-block px-3 py-1 text-sm font-bold bg-white/90 dark:bg-gray-800/90 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 rounded-lg backdrop-blur-sm">
                    {message.id}
                  </span>
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
            <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{message.title}</h3>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="font-medium text-primary-600 dark:text-primary-400">Published:</span>
              {format(new Date(message.published), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-primary-600 dark:text-primary-400">Updated:</span>
              {format(new Date(message.lastUpdated), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}; 