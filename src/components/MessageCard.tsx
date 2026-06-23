import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Message } from '@/lib/types';
import Image from 'next/image';
import { Card } from './Card';
import { FiRefreshCw } from 'react-icons/fi'
import { MdFiberNew } from 'react-icons/md'
import { BsStars } from 'react-icons/bs'
import sanitizeHtml from 'sanitize-html'

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
  'Azure Databricks': '/icons/databricks.svg',
  'Microsoft Loop': '/icons/loop.svg',
};

// Normalize service names
const normalizeService = (service: string): string => {
  // Return the service name as is
  return service;
};

function getPreviewFromMessage(message: any, maxLength = 120): { preview: string, isTruncated: boolean } {
  let html = ''
  if (message?.body?.content) html = message.body.content
  else if (message?.bodyPreview) html = message.bodyPreview
  else if (typeof message.details === 'string') html = message.details
  else html = ''
  const text = sanitizeHtml(html, { allowedTags: [] }).replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return { preview: text, isTruncated: false }
  return { preview: text.slice(0, maxLength).trim(), isTruncated: true }
}

function getHtmlPreviewFromMessage(message: any, maxLength = 120): { preview: string, isTruncated: boolean } {
  let html = ''
  if (message?.body?.content) html = message.body.content
  else if (message?.bodyPreview) html = message.bodyPreview
  else if (typeof message.details === 'string') html = message.details
  else html = ''
  // Allow more tags for richer preview
  const cleanHtml = sanitizeHtml(html, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li', 'span',
      'u', 'blockquote', 'code'
    ]
  })
  // Strip tags for length calculation
  const text = sanitizeHtml(cleanHtml, { allowedTags: [] }).replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return { preview: cleanHtml, isTruncated: false }
  // Truncate text, then find where to cut the HTML
  const truncatedText = text.slice(0, maxLength).trim()
  let idx = cleanHtml.indexOf(truncatedText) + truncatedText.length
  let truncatedHtml = cleanHtml.slice(0, idx)
  return { preview: truncatedHtml, isTruncated: true }
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, onClick }) => {
  const handleClick = () => {
    onClick(message.id);
  };

  // Deduplicate and normalize services
  const uniqueServices = Array.from(new Set(message.service.map(normalizeService)));

  return (
    <Link href={`/message/${message.id}`} className="block min-w-0 h-full">
      <div onClick={handleClick} className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full cursor-pointer flex flex-col min-w-0 overflow-hidden">
        {/* Major Change banner at the very top */}
  <div className="min-h-[38px]">
          {message.isMajorChange ? (
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
          ) : (
            <div className="h-[38px]" />
          )}
        </div>
        {/* Message ID and service badges row (now just below banner) */}
        <div className="w-full flex items-start justify-between relative px-4 pt-2 gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 break-all max-w-[120px]">{message.id}</span>
            {(() => {
              const isNew = message.tags.some(tag => tag.toLowerCase().includes('new feature'))
              const isUpdated = message.tags.some(tag => tag.toLowerCase().includes('update'))
              const isRetirement = message.tags.some(tag => tag.toLowerCase().includes('retirement'))
              if (!isNew && !isUpdated && !isRetirement) return null
              return (
                <>
                  {isNew && (
                    <span
                      className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap shadow-sm border bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border-emerald-200/70 dark:border-emerald-700/70 overflow-hidden text-ellipsis"
                      title="New"
                    >
                      New
                    </span>
                  )}
                  {isUpdated && (
                    <span
                      className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap shadow-sm border bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-200 border-teal-200/70 dark:border-teal-700/70 ml-1 overflow-hidden text-ellipsis"
                      title="Updated"
                    >
                      Updated
                    </span>
                  )}
                  {isRetirement && (
                    <span
                      className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap shadow-sm border bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 border-red-400 ml-1 overflow-hidden text-ellipsis"
                      title="Deprecation"
                    >
                      <svg className="w-3.5 h-3.5 mr-1 text-red-500 dark:text-red-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Deprecation
                    </span>
                  )}
                </>
              )
            })()}
          </div>
          <div className="flex flex-col items-end gap-y-0.5 min-w-0 max-w-[8rem]">
            {uniqueServices.length > 0 && uniqueServices.map((service) => (
              <span
                key={service}
                title={service}
                className="text-blue-700 dark:text-blue-200 px-1 py-0.5 text-xs font-medium flex items-center gap-1 z-10 w-full overflow-hidden"
              >
                {(() => {
                  const iconPath = service.startsWith('Microsoft 365') ? '/icons/m365.svg' : serviceIcons[service]
                  return iconPath && (
                    <Image
                      src={iconPath}
                      alt={service}
                      width={14}
                      height={14}
                      className="inline-block w-3.5 h-3.5 flex-shrink-0"
                    />
                  )
                })()}
                <span className="text-[11px] font-normal truncate min-w-0">
                  {service}
                </span>
              </span>
            ))}
          </div>
        </div>
        
        <div className={`relative flex flex-col h-full ${message.isMajorChange ? 'p-6' : 'pt-0 px-6 pb-8'}`}>
          <div className="flex-grow flex flex-col">
            <div>
              <div className="flex flex-wrap justify-center gap-1.5 mb-2">
                <div className="flex w-full gap-1 overflow-x-auto pb-1">
                  <div className="flex flex-nowrap gap-1 min-w-0 flex-1">
                    {message.tags.filter(tag => {
                      const tagLower = tag.toLowerCase()
                      return !tagLower.includes('user impact') && !tagLower.includes('admin impact') && !tagLower.includes('new feature') && !tagLower.includes('update') && !tagLower.includes('retirement')
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
                          className={`inline-flex items-center min-w-0 max-w-[120px] justify-center px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide whitespace-nowrap shrink shadow-sm hover:shadow transition-all duration-200 overflow-hidden text-ellipsis ${pillClass}`}>
                          {pillText}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className={`flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400 gap-1.5 mb-0${!message.isMajorChange ? ' pt-4' : ''}`}>
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
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors tracking-tight text-center break-words overflow-hidden">
                    {message.title}
                  </h3>
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
            {/* Impact label and pills pinned to bottom */}
            {(() => {
              const hasImpact = message.tags.some(tag => {
                const tagLower = tag.toLowerCase()
                return tagLower.includes('user impact') || tagLower.includes('admin impact')
              })
              if (!hasImpact) return null
              return (
                <div className="mt-auto flex flex-col items-center gap-1 px-0 pt-2 pb-0 min-h-[40px] justify-end">
                  <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400 mb-0.5 text-center">Impact</span>
                  <div className="flex flex-row gap-px">
                    {['user impact', 'admin impact'].map((impactType, idx, arr) => {
                      const tag = message.tags.find(t => t.toLowerCase().includes(impactType))
                      if (!tag) return null
                      let pillClass = ''
                      let pillText = ''
                      let borderClass = ''
                      if (impactType === 'user impact') {
                        pillClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
                        borderClass = 'border border-orange-400 shadow-[0_0_8px_2px_#fb923c] dark:border-orange-300'
                        pillText = 'User'
                      } else if (impactType === 'admin impact') {
                        pillClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                        borderClass = 'border border-red-500 shadow-[0_0_8px_2px_#ef4444] dark:border-red-300'
                        pillText = 'Admin'
                      }
                      return (
                        <React.Fragment key={impactType}>
                          <span
                            className={`inline-flex items-center justify-center w-8 h-4 px-1 py-0 rounded-md text-[9px] tracking-wide whitespace-nowrap shadow-lg transition-all duration-200 overflow-hidden text-ellipsis ${pillClass} ${borderClass}`}>
                            {pillText}
                          </span>
                          {idx === 0 && arr.length > 1 && message.tags.find(t => t.toLowerCase().includes('admin impact')) && (
                            <span className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-1" />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </Link>
  );
};