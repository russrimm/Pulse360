import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Message } from '@/lib/types';
import Image from 'next/image';
import { Card } from './Card';
import { FiRefreshCw } from 'react-icons/fi'
import { MdFiberNew } from 'react-icons/md'
import { BsStars } from 'react-icons/bs'

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
  'Microsoft OneDrive': '/icons/onedrive.svg',
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
  'Power Apps in Microsoft 365': '/icons/PowerApps_scalable.svg',
  'Microsoft Defender for Cloud Apps': '/icons/defender.svg',
  'Microsoft Clipchamp': '/icons/clipchamp.svg',
  'Microsoft Copilot (Microsoft 365)': '/icons/copilot.svg',
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
      <Card onClick={handleClick}>
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
        
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 relative">
              {message.id}
              {/* New/Updated pill/icon logic */}
              {(() => {
                const isNew = message.tags.some(tag => tag.toLowerCase().includes('new feature'))
                const isUpdated = message.tags.some(tag => tag.toLowerCase().includes('update'))
                if (isNew && isUpdated) {
                  return <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-400 shadow-sm" title="New & Updated">New &amp; Updated</span>
                }
                if (isNew) {
                  return <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-400 shadow-sm" title="New">New</span>
                }
                if (isUpdated) {
                  return <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-400 shadow-sm" title="Updated">Updated</span>
                }
                return null
              })()}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              {uniqueServices.map((service) => {
                const iconPath = service.startsWith('Microsoft 365') 
                  ? '/icons/m365.svg' 
                  : serviceIcons[service];
                return (
                  <div
                    key={service}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-transparent dark:text-blue-300 border border-blue-200 dark:border-blue-800 min-w-[120px] justify-center"
                  >
                    {iconPath && (
                      <Image
                        src={iconPath}
                        alt={service}
                        width={14}
                        height={14}
                        className="mr-1 w-3.5 h-3.5"
                      />
                    )}
                    <span className="truncate">{service}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-1.5 mb-2">
            <div className="flex w-full gap-1 overflow-x-auto pb-1">
              <div className="flex flex-nowrap gap-1 min-w-0 flex-1">
                {message.tags.filter(tag => {
                  const tagLower = tag.toLowerCase()
                  return !tagLower.includes('user impact') && !tagLower.includes('admin impact') && !tagLower.includes('new feature') && !tagLower.includes('update')
                }).map(tag => {
                  const tagLower = tag.toLowerCase()
                  let pillClass = 'bg-gray-50/90 text-gray-600 dark:bg-gray-800/20 dark:text-gray-300 border border-gray-200/30 dark:border-gray-700/20'
                  let pillText = tag
                  if (tagLower.includes('new feature')) {
                    pillClass = 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-200/30 dark:border-emerald-700/20'
                    pillText = 'New'
                  } else if (tagLower.includes('update')) {
                    pillClass = 'bg-teal-50/90 text-teal-700 dark:bg-teal-900/20 dark:text-teal-200 border border-teal-200/30 dark:border-teal-700/20'
                    pillText = 'Updated'
                  }
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center min-w-0 max-w-[120px] justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide whitespace-nowrap shrink shadow-sm hover:shadow transition-all duration-200 ${pillClass}`}
                      style={{textOverflow:'ellipsis',overflow:'hidden'}}>
                      {pillText}
                    </span>
                  )
                })}
              </div>
              <div className="flex flex-row gap-2 min-w-0 flex-shrink-0 justify-end w-auto ml-auto items-center">
                {/* Impact pills, larger, neon borders, User orange, Admin red */}
                <div className="flex flex-row items-center gap-2 mx-2 min-w-0">
                  {(() => {
                    const hasImpact = message.tags.some(tag => {
                      const tagLower = tag.toLowerCase()
                      return tagLower.includes('user impact') || tagLower.includes('admin impact')
                    })
                    if (!hasImpact) return null
                    return <span className="text-sm font-bold text-primary-600 dark:text-primary-400 mr-2 whitespace-nowrap">Impact</span>
                  })()}
                  <div className="flex flex-col gap-1">
                    {['user impact', 'admin impact'].map(impactType => {
                      const tag = message.tags.find(t => t.toLowerCase().includes(impactType))
                      if (!tag) return null
                      let pillClass = ''
                      let pillText = ''
                      let borderClass = ''
                      if (impactType === 'user impact') {
                        pillClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
                        borderClass = 'border-4 border-orange-400 shadow-[0_0_8px_2px_#fb923c] dark:border-orange-300'
                        pillText = 'User'
                      } else if (impactType === 'admin impact') {
                        pillClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                        borderClass = 'border-4 border-red-500 shadow-[0_0_8px_2px_#ef4444] dark:border-red-300'
                        pillText = 'Admin'
                      }
                      return (
                        <span
                          key={impactType}
                          className={`inline-flex items-center justify-center w-10 h-5 px-2 py-0 rounded-md text-[12px] font-bold tracking-wide whitespace-nowrap shadow-lg transition-all duration-200 ${pillClass} ${borderClass.replace('border-4', 'border-2')}`}
                          style={{textOverflow:'ellipsis',overflow:'hidden'}}>
                          {pillText}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400 gap-1.5 mb-1">
            <span className="font-medium">Published</span>
            <span>{format(new Date(message.published), 'MMM d, yyyy')}</span>
            {format(new Date(message.published).setHours(0,0,0,0), 'yyyy-MM-dd') !== format(new Date(message.lastUpdated).setHours(0,0,0,0), 'yyyy-MM-dd') && (
              <>
                <span>•</span>
                <span className="font-medium">Updated</span>
                <span>{format(new Date(message.lastUpdated), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
          
          <div className="flex flex-col flex-grow justify-center">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors tracking-tight text-center">{message.title}</h3>
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
      </Card>
    </Link>
  );
}; 