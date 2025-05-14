import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Message } from '@/lib/types';
import Image from 'next/image';

interface MessageCardProps {
  message: Message;
  onClick: (messageId: string) => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, onClick }) => {
  const handleClick = () => {
    onClick(message.id);
  };

  return (
    <Link href={`/message/${message.id}`}>
      <div 
        className="group bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-1 h-full cursor-pointer"
        onClick={handleClick}
      >
        <div className="p-6">
          <div className="flex flex-col mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium text-gray-500 dark:text-white">{message.id}</span>
              {message.isMajorChange && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
                  Major Change
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{message.title}</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {message.service.map((service) => {
              if (service === 'Power Apps' || service === 'Power Apps in Microsoft 365') {
                return (
                  <div
                    key={service}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <Image
                      src="/icons/PowerApps_scalable.svg"
                      alt="Power Apps"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Power Apps
                  </div>
                );
              }
              if (service === 'Power Automate' || service === 'Microsoft Power Automate' || service === 'Microsoft Power Automate in Microsoft 365') {
                return (
                  <div
                    key={service}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <Image
                      src="/icons/PowerAutomate_scalable.svg"
                      alt="Power Automate"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Power Automate
                  </div>
                );
              }
              if (service === 'Power Platform') {
                return (
                  <div
                    key={service}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <Image
                      src="/icons/PowerPlatform_scalable.svg"
                      alt="Power Platform"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Power Platform
                  </div>
                );
              }
              if (service === 'Microsoft Dataverse') {
                return (
                  <div
                    key={service}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <Image
                      src="/icons/Dataverse_scalable.svg"
                      alt="Microsoft Dataverse"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Dataverse
                  </div>
                );
              }
              if (service === 'Power BI') {
                return (
                  <div
                    key={service}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <Image
                      src="/icons/PowerBI_scalable.svg"
                      alt="Power BI"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Power BI
                  </div>
                );
              }
              if (service === 'Microsoft Teams') {
                return (
                  <div
                    key={service}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <Image
                      src="/icons/teams.svg"
                      alt="Microsoft Teams"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Teams
                  </div>
                );
              }
              if (service === 'SharePoint Online') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Image
                      src="/icons/sharepoint.svg"
                      alt="SharePoint Online"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    SharePoint Online
                  </div>
                );
              }
              if (service.startsWith('Microsoft 365')) {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Image
                      src="/icons/m365.svg"
                      alt="Microsoft 365"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    {service}
                  </div>
                );
              }
              if (service === 'OneDrive for Business') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Image
                      src="/icons/onedrive.svg"
                      alt="OneDrive for Business"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    OneDrive for Business
                  </div>
                );
              }
              if (service === 'Stream' || service === 'Microsoft Stream') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Image
                      src="/icons/stream.svg"
                      alt="Microsoft Stream"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Stream
                  </div>
                );
              }
              if (service === 'Exchange Online') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Image
                      src="/icons/exchange.svg"
                      alt="Exchange Online"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Exchange Online
                  </div>
                );
              }
              if (service === 'Forms' || service === 'Microsoft Forms') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Image
                      src="/icons/forms.svg"
                      alt="Microsoft Forms"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Forms
                  </div>
                );
              }
              if (service === 'Intune' || service === 'Microsoft Intune') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <img
                      src="/icons/intune.svg"
                      alt="Microsoft Intune"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Intune
                  </div>
                );
              }
              if (service === 'Planner' || service === 'Microsoft Planner') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <img
                      src="/icons/planner.svg"
                      alt="Microsoft Planner"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Planner
                  </div>
                );
              }
              if (service === 'Entra' || service === 'Microsoft Entra') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <img
                      src="/icons/entra.svg"
                      alt="Microsoft Entra"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Entra
                  </div>
                );
              }
              if (service === 'Dynamics 365 Apps' || service === 'Microsoft Dynamics 365 Apps') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <img
                      src="/icons/Dynamics365_scalable.svg"
                      alt="Dynamics 365 Apps"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Dynamics 365 Apps
                  </div>
                );
              }
              if (service === 'Viva' || service === 'Microsoft Viva') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <img
                      src="/icons/viva.svg"
                      alt="Microsoft Viva"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Viva
                  </div>
                );
              }
              if (service === 'Purview' || service === 'Microsoft Purview') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <img
                      src="/icons/purview.svg"
                      alt="Microsoft Purview"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Purview
                  </div>
                );
              }
              if (service === 'Defender XDR' || service === 'Microsoft Defender XDR') {
                return (
                  <div key={service} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <img
                      src="/icons/defender.svg"
                      alt="Microsoft Defender XDR"
                      width={16}
                      height={16}
                      className="mr-1"
                    />
                    Microsoft Defender XDR
                  </div>
                );
              }
              return (
                <span
                  key={service}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  {service}
                </span>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Published: {format(new Date(message.published), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Updated: {format(new Date(message.lastUpdated), 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {message.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50/80 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}; 